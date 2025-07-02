import { redirect } from "next/navigation"

export default function HomePage() {
  // Redirect to notifications dashboard as the main entry point
  redirect("/notifications/dashboard")
}
