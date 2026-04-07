import { redirect } from "next/navigation"

export default function Home() {
  // Redirect to the comparison page (your main feature)
  redirect("/comparison")
}
