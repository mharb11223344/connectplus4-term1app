import type { Metadata } from "next";
import LearningApp from "./LearningApp";

export const metadata: Metadata = {
  title: "Mona’s English Garden | Primary 4",
  description: "An interactive English learning adventure for Primary 4 students by Mrs. Mona Harb.",
};

export default function Home() {
  return <LearningApp />;
}
