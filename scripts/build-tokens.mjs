import { register } from '@tokens-studio/sd-transforms';
import StyleDictionary from 'style-dictionary';
import { readFileSync } from 'fs';

register(StyleDictionary);

const tokensFile = JSON.parse(readFileSync('tokens/tokens.json', 'utf-8'));

const sd = new StyleDictionary({
  tokens: tokensFile['global'],
  platforms: {
    css: {
      transformGroup: 'tokens-studio',
      prefix: 'token',
      buildPath: 'src/styles/tokens/generated/',
      files: [
        {
          destination: '_variables.css',
          format: 'css/variables',
          options: {
            outputReferences: true
          }
        }
      ]
    }
  }
});

async function build() {
  try {
    await sd.buildAllPlatforms();
    console.log('✓ Design tokens built successfully');
  } catch (err) {
    console.error('✗ Token build failed:', err);
    process.exit(1);
  }
}

build();
