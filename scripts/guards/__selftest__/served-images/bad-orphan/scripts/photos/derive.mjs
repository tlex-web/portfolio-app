// Clean derivative step: reads metadata, rotates, writes nothing back.
export async function derive(sharp, input) {
  const md = await sharp(input).metadata();
  return { md, out: await sharp(input).rotate().resize(640).webp().toBuffer() };
}
