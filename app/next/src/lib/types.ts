export type Collection = "skills" | "certifications" | "projects" | "experience" | "education";
export type Profile = {
  name: string;
  title: string;
  location: string;
  tagline: string;
  about: string[];
  email: string;
  phone: string;
  github: string;
  linkedin: string;
};
export type Skill = { name: string; domain: string; level: string };
export type Certification = {
  title: string;
  code: string;
  issuer: string;
  description: string;
  seal: string;
};
export type Project = {
  name: string;
  kind: string;
  art: string;
  description: string;
  tags: string[];
  points: string[];
  link: string | null;
};
export type Journey = { title: string; label: string; text: string };
export type RecordItem<T = Record<string, unknown>> = {
  id: string;
  collection: Collection | "profile";
  data: T;
  position: number;
  published: number;
  updated_at?: string;
};
export type Content = {
  profile: Profile;
  skills: Skill[];
  certifications: Certification[];
  projects: Project[];
  experience: Journey[];
  education: Journey[];
};
export type Contact = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  created_at: string;
};
