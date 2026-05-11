"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function deleteProject(id: string) {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  await prisma.project.delete({
    where: { id, userId: session.userId },
  });
}
