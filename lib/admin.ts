export const adminEmails = ['kruballymuhammedmalick4@gmail.com'];

export function isAdminEmail(email?: string | null) {
  return Boolean(email && adminEmails.includes(email.trim().toLowerCase()));
}
