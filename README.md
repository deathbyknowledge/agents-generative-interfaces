# Generative Interfaces on Cloudflare Agents

Implementing this paper: https://salt-nlp.github.io/generative_interfaces/
Code is adapted from the author's repository: https://github.com/SALT-NLP/GenUI

The original implementation is built on top of LangGraph's `open-canvas` and requires a Supabase setup. Cloudflare makes it easier.

The inference provider is set to OpenRouter. I used Cerebras as the only provider from OpenRouter due to their high throughput. Highly recommend.

NOTE: This is highly experimental, focused as an educational resource.
