"use server";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function updateProject(id: string, name: string) {
  const session = await getSession();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const project = await prisma.project.update({
    where: { id, userId: session.userId },
    data: { name },
  });

  return project;
}
