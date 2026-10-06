import { z } from "zod";
const short = z.string().trim().min(1).max(200);
const text = z.string().trim().max(3000);
const url = z
  .string()
  .max(1000)
  .refine((v) => v === "" || /^https:\/\/[^\s]+$/.test(v), "Use an HTTPS link.");
const schemas = {
  profile: z
    .object({
      name: short,
      title: short,
      location: short,
      tagline: text,
      about: z.array(text).min(1).max(6),
      email: z.string().email().max(200),
      phone: z.string().max(40),
      github: url,
      linkedin: url,
    })
    .strict(),
  skills: z.object({ name: short, domain: short, level: short }).strict(),
  certifications: z
    .object({
      title: short,
      code: z.string().max(60),
      issuer: short,
      description: text,
      seal: z.string().max(8),
    })
    .strict(),
  projects: z
    .object({
      name: short,
      kind: short,
      art: short,
      description: text,
      tags: z.array(short).max(15),
      points: z.array(text).max(12),
      link: url.nullable(),
    })
    .strict(),
  experience: z.object({ title: short, label: short, text }).strict(),
  education: z.object({ title: short, label: short, text }).strict(),
};
export const recordSchema = z
  .object({
    collection: z.enum([
      "profile",
      "skills",
      "certifications",
      "projects",
      "experience",
      "education",
    ]),
    data: z.unknown(),
    position: z.number().int().min(0).max(100000),
    published: z.boolean(),
  })
  .strict()
  .superRefine((v, ctx) => {
    const result = schemas[v.collection].safeParse(v.data);
    if (!result.success)
      ctx.addIssue({
        code: "custom",
        message: result.error.issues[0]?.message || "Invalid content.",
      });
  });
export const contactSchema = z
  .object({
    name: short,
    email: z.string().trim().email().max(200),
    subject: z.string().trim().max(200),
    message: z.string().trim().min(10).max(3000),
    website: z.string().max(200).optional(),
  })
  .strict();
