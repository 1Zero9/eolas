import crypto from 'node:crypto';
import { cookies } from 'next/headers';
import { prisma } from '@/src/lib/db';
import { slugify } from '@/src/lib/utils';

export const ACTIVE_ORGANIZATION_COOKIE = 'eolas-active-organization';
export const CAPTURE_SESSION_COOKIE = 'eolas-capture-session';

function hashPasscode(passcode: string, salt = crypto.randomBytes(16).toString('hex')) {
  return `${salt}:${crypto.scryptSync(passcode, salt, 32).toString('hex')}`;
}

function verifyPasscode(passcode: string, stored: string | null) {
  if (!stored) return false;
  const [salt, expected] = stored.split(':');
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(passcode, salt, 32).toString('hex');
  return actual.length === expected.length && crypto.timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

function captureSignature(organizationId: string, expiresAt: number) {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (!secret) throw new Error('AUTH_SESSION_SECRET is not configured');
  return crypto.createHmac('sha256', secret).update(`capture.${organizationId}.${expiresAt}`).digest('base64url');
}

export function createCaptureSession(organizationId: string, sessionVersion: number) {
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 12;
  return `${organizationId}.${sessionVersion}.${expiresAt}.${captureSignature(organizationId, expiresAt)}`;
}

export function hasCaptureSession(cookieValue: string | undefined, organizationId: string, sessionVersion: number) {
  if (!cookieValue) return false;
  const [id, versionText, expiresAtText, signature] = cookieValue.split('.');
  const expiresAt = Number(expiresAtText);
  const version = Number(versionText);
  if (id !== organizationId || version !== sessionVersion || !Number.isInteger(expiresAt) || expiresAt < Math.floor(Date.now() / 1000) || !signature) return false;
  try {
    const expected = captureSignature(organizationId, expiresAt);
    return expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch { return false; }
}

export async function getActiveOrganization() {
  const store = await cookies();
  const selected = store.get(ACTIVE_ORGANIZATION_COOKIE)?.value;
  if (selected) {
    const organization = await prisma.organization.findUnique({ where: { id: selected } });
    if (organization) return organization;
  }
  return prisma.organization.findFirst({ orderBy: { createdAt: 'asc' } });
}

export async function requireActiveOrganization() {
  const organization = await getActiveOrganization();
  if (!organization) throw new Error('No organization is configured');
  return organization;
}

export async function getOrganizationBySlug(slug: string) {
  return prisma.organization.findUnique({ where: { slug } });
}

export async function createOrganization(input: { name: string; slug?: string; capturePasscode: string }) {
  const name = input.name.trim();
  const slug = slugify(input.slug || name);
  if (!name) throw new Error('Organization name is required');
  if (input.capturePasscode.trim().length < 8) throw new Error('Capture passcode must be at least 8 characters');
  return prisma.organization.create({ data: { name, slug, capturePasscodeHash: hashPasscode(input.capturePasscode.trim()) } });
}

export async function verifyOrganizationPasscode(organizationId: string, passcode: string) {
  const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
  return !!organization?.captureEnabled && verifyPasscode(passcode, organization.capturePasscodeHash);
}

export async function rotateOrganizationPasscode(organizationId: string, passcode: string) {
  const normalized = passcode.trim();
  if (normalized.length < 8) throw new Error('Capture passcode must be at least 8 characters');
  return prisma.organization.update({
    where: { id: organizationId },
    data: { capturePasscodeHash: hashPasscode(normalized), captureSessionVersion: { increment: 1 } },
  });
}
