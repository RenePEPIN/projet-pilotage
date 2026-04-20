import { redirect } from "next/navigation";

export default function ProjectIndexPage({ params }) {
  redirect(`/projects/${params.projectId}/dashboard`);
}
