export class CsvFormatter {
  static escape(value: string): string {
    return value.replace(/"/g, '""')
  }

  static formatDate(timestamp: number): string {
    return new Date(timestamp).toISOString().split("T")[0]
  }

  static formatTime(timestamp: number): string {
    return new Date(timestamp).toTimeString().split(" ")[0]
  }
}
