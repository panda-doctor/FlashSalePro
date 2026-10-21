<script setup lang="ts">
import { ref } from 'vue'
import { useParticleField } from '@/shared/composables/useParticleField'

const canvas = ref<HTMLCanvasElement | null>(null)

useParticleField(canvas)
</script>

<template>
  <div class="particle-field" aria-hidden="true">
    <div class="particle-aurora" />
    <div class="particle-orb particle-orb--azure" />
    <div class="particle-orb particle-orb--indigo" />
    <div class="particle-orb particle-orb--sky" />
    <canvas ref="canvas" class="particle-canvas" />
    <div class="particle-vignette" />
    <div class="particle-noise" />
  </div>
</template>

<style scoped>
/* 信任浅色粒子层：底色透明，近白画布与冷色极光由 body 与 aurora 提供 */
.particle-field {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background: transparent;
}

.particle-aurora {
  position: absolute;
  inset: -20% 0 auto;
  height: 80vh;
  background:
    radial-gradient(ellipse 46% 42% at 50% 0%, rgba(29, 78, 216, 0.1), transparent 70%),
    radial-gradient(ellipse 36% 34% at 52% 8%, rgba(99, 102, 241, 0.1), transparent 72%);
}

.particle-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.particle-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(80px);
  opacity: 0.13;
  will-change: transform;
}

.particle-orb--azure {
  top: 8%;
  left: 12%;
  width: 38vw;
  height: 38vw;
  background: #dbeafe;
  animation: cool-drift-azure 68s ease-in-out infinite alternate;
}

.particle-orb--indigo {
  top: 28%;
  right: 2%;
  width: 34vw;
  height: 34vw;
  background: #e0e7ff;
  opacity: 0.11;
  animation: cool-drift-indigo 82s ease-in-out infinite alternate;
}

.particle-orb--sky {
  bottom: -14%;
  left: 30%;
  width: 36vw;
  height: 36vw;
  background: #bfdbfe;
  opacity: 0.1;
  animation: cool-drift-sky 74s ease-in-out infinite alternate;
}

/* 用纯白柔化四周，避免浅底出现脏灰边缘 */
.particle-vignette {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 28%, transparent 38%, rgba(251, 252, 253, 0.55) 100%),
    linear-gradient(180deg, rgba(251, 252, 253, 0.32) 0%, transparent 24%, transparent 76%, rgba(251, 252, 253, 0.46) 100%);
}

.particle-noise {
  position: absolute;
  inset: 0;
  opacity: 0.018;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.86' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E");
  background-size: 160px 160px;
  mix-blend-mode: multiply;
}

@keyframes cool-drift-azure {
  from {
    transform: translate3d(-4%, -3%, 0) scale(1);
  }
  to {
    transform: translate3d(8%, 6%, 0) scale(1.08);
  }
}

@keyframes cool-drift-indigo {
  from {
    transform: translate3d(3%, 4%, 0) scale(1.05);
  }
  to {
    transform: translate3d(-7%, -5%, 0) scale(1);
  }
}

@keyframes cool-drift-sky {
  from {
    transform: translate3d(-5%, 2%, 0) scale(1);
  }
  to {
    transform: translate3d(6%, -4%, 0) scale(1.1);
  }
}

@media (max-width: 767px) {
  .particle-orb {
    filter: blur(60px);
    opacity: 0.1;
  }

  .particle-orb--sky {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .particle-orb {
    animation: none;
  }
}
</style>
