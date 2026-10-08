const fireIcon = document.querySelector(".fire-icon");

if (!(fireIcon instanceof HTMLButtonElement)) {
    throw new Error("No se encontró el ícono interactivo del fuego.");
}

let audioContext;
let fireSound;

function startFireSound() {
    if (fireSound) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
        console.error("Este navegador no admite la reproducción de audio Web Audio.");
        return;
    }

    audioContext ??= new AudioContextClass();

    const play = () => {
        if (fireSound) return;

        const duration = 8;
        const buffer = audioContext.createBuffer(
            1,
            Math.floor(audioContext.sampleRate * duration),
            audioContext.sampleRate
        );
        const samples = buffer.getChannelData(0);
        let softenedNoise = 0;

        for (let index = 0; index < samples.length; index += 1) {
            const noise = Math.random() * 2 - 1;
            softenedNoise = softenedNoise * 0.72 + noise * 0.28;
            samples[index] = noise * 0.035 + softenedNoise * 0.045;
        }

        const crackleCount = Math.floor(duration * 2.6);
        for (let crackle = 0; crackle < crackleCount; crackle += 1) {
            const margin = Math.floor(audioContext.sampleRate * 0.08);
            const start = margin + Math.floor(Math.random() * (samples.length - margin * 2));
            const length = Math.floor(audioContext.sampleRate * (0.006 + Math.random() * 0.035));
            const strength = 0.12 + Math.random() * 0.28;

            for (let offset = 0; offset < length && start + offset < samples.length; offset += 1) {
                const progress = offset / length;
                const decay = (1 - progress) ** 3;
                const snap = offset < length * 0.12 ? 1.7 : 1;
                samples[start + offset] += (Math.random() * 2 - 1) * strength * decay * snap;
            }
        }

        const source = audioContext.createBufferSource();
        const filter = audioContext.createBiquadFilter();
        const volume = audioContext.createGain();

        source.buffer = buffer;
        source.loop = true;
        filter.type = "lowpass";
        filter.frequency.value = 3200;
        filter.Q.value = 0.7;
        volume.gain.value = 0.42;

        source.connect(filter);
        filter.connect(volume);
        volume.connect(audioContext.destination);
        source.start();

        fireSound = { source, filter, volume };
    };

    if (audioContext.state === "suspended") {
        audioContext.resume().then(play).catch((error) => {
            console.error("No se pudo iniciar el sonido del fuego.", error);
        });
    } else {
        play();
    }
}

function stopFireSound() {
    if (!fireSound) return;

    const { source, filter, volume } = fireSound;
    fireSound = undefined;
    volume.gain.setTargetAtTime(0, audioContext.currentTime, 0.025);
    source.stop(audioContext.currentTime + 0.12);
    source.addEventListener("ended", () => {
        source.disconnect();
        filter.disconnect();
        volume.disconnect();
    }, { once: true });
}

fireIcon.addEventListener("pointerenter", startFireSound);
fireIcon.addEventListener("pointerleave", stopFireSound);
fireIcon.addEventListener("focus", startFireSound);
fireIcon.addEventListener("blur", stopFireSound);