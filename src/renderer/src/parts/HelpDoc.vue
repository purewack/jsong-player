<template>
    <div class="p-4 max-w-[70ch] mx-auto font-mono ">
        <h1 class="heading text-center">How to use the player:</h1>

        <p>To load files, use the
            <Control icon="file-earmark-music" :small="true" /> button, then find your .jsong or .json file.
        </p>
        <p>The sound will auto-play with the metronome off, which you can toggle by pressing:
            <Control :small="true" class="flex items-center justify-center w-32 h-8">
                <p class=" bg-transparent text-center text-sm font-mono">[idx] B/N</p>
            </Control>
        </p>
        <br />
        <p>When you load your file, it will auto-play from the first defined section. Use the <code
                class="text-white font-mono text-sm">See Manifest</code> option to inspect your file</p>
        <br />
        <p>The
            <Control icon="play" /> button will change to a
            <Control icon="stop" /> if playing music. You can press the
            <Control icon="stop" /> to queue a stop, or double press to stop immediately
        </p>
        <p>The
            <Control icon="fast-forward" /> button will trigger the next section queue transition.
        </p>
        <p>The
            <Control icon="skip-forward" /> will do the same but will not follow looping rules defined by flow
            repeats.
        </p>
        <p>You can also use the <Control class="inline">
                <input type="text" placeholder="[1,...]"
                    class=" w-16 h-8 bg-transparent text-center text-sm font-mono"></input>
            </Control>
            to queue a particular section, by index number. You can do the same by simply clicking the section you
            want within the section flow map.
        </p>
        <br />
        <p>Injecting sections means a substitution of the current playing section for the one you want to swap to.
            This will happen instantly and can sound out of place. This can be quantized in the manifest file using
            the @ notation.</p>
    </div>
</template>

<script setup>
import Control from './Control.vue';

</script>

