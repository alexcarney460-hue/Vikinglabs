#!/bin/bash
# Add env vars to Vercel without newlines
printf 'true' | npx vercel env add MARKETING_API_ENABLED production
printf '753b363687e8c3e2b9d296408cf0e076593fb40e92825f098663d891c4cfefca' | npx vercel env add MARKETING_KEY production
printf 'sk_0290b9b714df64e3c0c0931ebcd58ba25635798e2a3e428f' | npx vercel env add ELEVENLABS_API_KEY production
printf 'key_c52a43e0677a1b43e95b26bd7f87f05978cc025624dbb24ecb7c841ce2b9b5ef32a50c90ff1cd1d33c78ba5b65b5d9acaa2a8a1c26777884f093aa8e3fb499bb' | npx vercel env add RUNWAY_API_KEY production
printf 'b396a03f04374ec5078fa6ccad184ad4e27678f4f6bc260a92436dbc2b24ce48' | npx vercel env add SOCIAL_TOKEN_ENC_KEY production
printf '8314359521' | npx vercel env add INSTAGRAM_USERNAME production
printf 'Ny75x1c3' | npx vercel env add INSTAGRAM_PASSWORD production
