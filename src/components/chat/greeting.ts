/** El saludo según la hora: buenos días hasta las 12, buenas tardes hasta las 19. */
export function greetingKey(hour = new Date().getHours()): "chat.greeting.morning" | "chat.greeting.afternoon" | "chat.greeting.evening" {
  if (hour < 12) return "chat.greeting.morning";
  if (hour < 19) return "chat.greeting.afternoon";
  return "chat.greeting.evening";
}
