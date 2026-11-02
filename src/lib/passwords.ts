/** Konfigurasi password server; jangan diimpor oleh komponen client. */
export function requirePassword(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`${name} belum diatur di environment.`);
  return value;
}

export function getEventPasswords() {
  const passwords = {
    NFH: requirePassword("NFH_EVENT_PASSWORD"),
    FHI: requirePassword("FHI_EVENT_PASSWORD"),
    BALI: requirePassword("BALI_EVENT_PASSWORD"),
  };
  if (new Set(Object.values(passwords)).size !== Object.keys(passwords).length) {
    throw new Error("Password setiap acara harus berbeda.");
  }
  return passwords;
}
