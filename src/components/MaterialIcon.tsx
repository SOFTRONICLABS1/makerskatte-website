const paths: Record<string, string> = {
  wood: 'M5 24 25 7l12 7-20 18-12-5Z M5 24l12 5 20-17 M17 29v3 M13 21l9-8 M19 23l9-8 M25 12l3 2 M10 24l3 1',
  acrylic: 'm4 15 17-9 17 9-17 9-17-9Z M4 22l17 9 17-9 M4 29l17 9 17-9',
  metal: 'm6 13 15-8 15 8v18l-15 8-15-8V13Z M6 13l15 8 15-8 M21 21v18',
  leather: 'M12 5c5 5 13 5 18 0l5 8c-7 5-7 12 0 17l-5 8c-5-5-13-5-18 0l-5-8c7-5 7-12 0-17l5-8Z',
  glass: 'm9 10 23-5v29l-23 5V10Z M9 10l-3-2 23-5 3 2 M6 8v29l3 2 M14 25l12-12 M16 30l8-8'
};

export default function MaterialIcon({ name }: { name: string }) {
  const key = Object.keys(paths).find((material) => name.toLowerCase().replace('acrlyic', 'acrylic').includes(material));
  return <svg className="material-icon" viewBox="0 0 42 44" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
    <path d={paths[key ?? ''] ?? 'm6 13 15-8 15 8v18l-15 8-15-8V13Z M6 13l15 8 15-8 M21 21v18'} />
  </svg>;
}
