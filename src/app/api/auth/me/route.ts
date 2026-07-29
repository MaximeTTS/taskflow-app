import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { ACCESS_COOKIE } from '@/lib/cookies';

/**
 * Utilisateur de la session courante.
 *
 * Sert a rehydrater le client au chargement : les jetons etant `httpOnly`,
 * le navigateur ne peut plus lire l'identite depuis le stockage local.
 */
export async function GET(req: NextRequest) {
  const token = req.cookies.get(ACCESS_COOKIE)?.value;

  if (!token) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const payload = verifyToken(token);

  if (!payload) {
    // Acces expire : le client tentera un rafraichissement.
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.id },
    select: { id: true, email: true, name: true, avatar: true },
  });

  return NextResponse.json({ user: user ?? null });
}
