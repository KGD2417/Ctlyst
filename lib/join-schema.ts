/**
 * One validation definition, used by BOTH the client (for inline messages) and
 * the server (which never trusts the client). Divergence between the two is how
 * forms end up accepting garbage.
 *
 * Messages explain what happened and how to fix it, and never apologise (L7).
 */

export type Field = "name" | "email" | "role" | "message";

export const ROLES = [
  { value: "founder",     label: "Student / early-stage founder" },
  { value: "mentor",      label: "Experienced professional / retiree (mentor)" },
  { value: "institution", label: "College, incubator, or CSR partner" },
  { value: "other",       label: "Other" },
] as const;

const NAME_RE = /^[\p{L}\p{M}'.\- ]{2,80}$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type Payload = Partial<Record<Field, string>> & { website?: string };

export function validate(data: Payload): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  const name = (data.name ?? "").trim();
  const email = (data.email ?? "").trim();
  const role = (data.role ?? "").trim();
  const message = (data.message ?? "").trim();

  if (!name) errors.name = "Add your name so we know who we are replying to.";
  else if (!NAME_RE.test(name))
    errors.name = "Names can use letters, spaces, apostrophes, hyphens and full stops.";

  if (!email) errors.email = "Add an email address — it is the only way we can reply.";
  else if (!EMAIL_RE.test(email))
    errors.email = "That address is missing an @ or a domain. Check it and try again.";

  if (!role) errors.role = "Choose the description that fits you best.";
  else if (!ROLES.some((r) => r.value === role))
    errors.role = "Choose one of the listed options.";

  if (!message) errors.message = "Tell us what you are building and where you are stuck.";
  else if (message.length < 10)
    errors.message = `A little more detail helps — ${10 - message.length} more character${10 - message.length === 1 ? "" : "s"} at least.`;
  else if (message.length > 2000)
    errors.message = `That is ${message.length - 2000} characters over the 2,000 limit.`;

  return errors;
}
