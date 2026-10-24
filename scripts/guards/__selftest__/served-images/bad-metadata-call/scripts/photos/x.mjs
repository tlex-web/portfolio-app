export async function derive(sharp, input) {
  return sharp(input).rotate().withMetadata().webp().toBuffer();
}
