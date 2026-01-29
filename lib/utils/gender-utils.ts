/**
 * Gender utility functions
 * Centralizes gender-related display logic
 */

type Gender = "MALE" | "FEMALE" | "OTHER" | string;

/**
 * Get Tailwind gradient classes based on gender
 * Used for avatars and decorative elements
 */
export function getGenderGradient(gender: Gender): string {
  switch (gender) {
    case "MALE":
      return "from-sky-400 to-blue-500";
    case "FEMALE":
      return "from-rose-400 to-pink-500";
    default:
      return "from-teal-400 to-cyan-500";
  }
}

/**
 * Get emoji representation of gender
 */
export function getGenderEmoji(gender: Gender): string {
  switch (gender) {
    case "MALE":
      return "👶🏻";
    case "FEMALE":
      return "👶🏻";
    default:
      return "👶";
  }
}
