declare global {
  const Bun: {
    file(path: string): {
      exists(): Promise<boolean>
      json(): Promise<unknown>
      text(): Promise<string>
    }
    write(path: string, content: string): Promise<number>
  }
}

export {}
