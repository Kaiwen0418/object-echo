import { redirect } from "next/navigation";

export default async function AssetsPage({
  params
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  redirect(`/dashboard/${projectId}/devices`);
}
