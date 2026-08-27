<script setup lang="ts">
import { CARE_SECTIONS } from '@/data/care-guide';
</script>

<template>
  <section class="rounded-3xl border border-default bg-default/80 p-4 shadow-sm sm:p-6">
    <h2 class="text-xl font-bold tracking-tight text-highlighted sm:text-2xl">
      Instructions
    </h2>
    <p class="mt-1 text-sm text-muted">
      Tout ce qu'il faut savoir pour chouchouter Malta. Déplie une section.
    </p>

    <div class="mt-4 space-y-2">
      <details
        v-for="section in CARE_SECTIONS"
        :key="section.id"
        class="group rounded-2xl border border-default bg-elevated open:bg-default"
      >
        <summary class="flex cursor-pointer list-none items-center gap-3 rounded-2xl p-4 text-left font-semibold text-highlighted touch-manipulation [&::-webkit-details-marker]:hidden">
          <span
            class="text-xl"
            aria-hidden="true"
          >{{ section.emoji }}</span>
          <span>{{ section.title }}</span>
          <span class="ml-auto text-muted transition group-open:rotate-180">⌄</span>
        </summary>

        <div class="space-y-3 px-4 pb-4">
          <template
            v-for="(block, index) in section.blocks"
            :key="`${section.id}-${index}`"
          >
            <p
              v-if="block.type === 'p'"
              class="text-sm leading-relaxed text-muted"
            >
              {{ block.text }}
            </p>
            <a
              v-else-if="block.type === 'link'"
              :href="block.href"
              class="inline-flex text-sm font-semibold text-secondary-700 underline-offset-4 hover:underline dark:text-secondary-300"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ block.label }}
            </a>
            <img
              v-else-if="block.type === 'image' && block.src"
              :src="block.src"
              :alt="block.alt"
              width="1536"
              height="2048"
              class="mx-auto h-auto max-h-96 w-auto max-w-full rounded-2xl object-contain"
              loading="lazy"
              decoding="async"
            >
            <div
              v-else-if="block.type === 'image'"
              class="flex min-h-28 items-center justify-center rounded-2xl border-2 border-dashed border-malta-300 bg-malta-50 text-sm text-muted dark:border-malta-700 dark:bg-malta-900/40 sm:min-h-36"
            >
              Image à venir
            </div>
          </template>
        </div>
      </details>
    </div>
  </section>
</template>
