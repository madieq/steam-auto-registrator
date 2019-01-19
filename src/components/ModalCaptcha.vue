<template lang="pug">
    .modal_container
        .modal_captcha
            div
                input(type='text' placeholder='type captcha' ref='capchaInput' :value='inputCaptcha' @keyup.enter='sendCaptcha' @input="inputCaptcha=($event.target.value+'').toUpperCase()")
            .captcha_image(:style='{backgroundImage:"url("+captchaImageUrl+")"}')

</template>

<script lang="ts">
	import Vue from "vue";
	import Component from "vue-class-component";
	import * as fse from "fs-extra";
	import { app, BrowserWindow, ipcRenderer } from "electron";

	import { EventBus } from "@/EventBus";

	@Component({ props: {}, components: {} })
	export default class ModalCaptcha extends Vue {
		inputCaptcha = "";
		captchaImageUrl = "https://i.ytimg.com/vi/664VCs3c1HU/maxresdefault.jpg";
		sendCaptcha() {
			this.inputCaptcha = "";
		}
		getForType() {
			(this.$refs["capchaInput"] as HTMLElement).focus();
		}
		mounted() {
			this.getForType();
		}
	}
</script>

<style lang="stylus" scoped>
    .modal_container
        position fixed
        top 0
        left 0
        height 100%
        width 100%
        background rgba(#000,0.6)
    .modal_captcha
        padding 10px
        position fixed
        top 50%
        left 50%
        transform translate(-50%, -50%)
        height 90%
        width 90%
        border-radius 4px

        background-color #eee

        display flex
        flex-direction column
        // align-items stretch
        justify-content center
        .captcha_image
            // width 80%
            background-color #222
            background-position 50% 50%
            background-repeat no-repeat
            background-size contain
            min-height 200px
            margin-top 10px
            flex-grow 1
        div
            display flex
            flex-direction row
            align-items center
            justify-content center
            width 100%
    input
        text-align center
        background #eee
        color #555
        font-size 40px
        text-transform uppercase
        height auto
        width auto
        border-bottom 1px solid #0af
        flex-shrink 0
        flex-grow 1
        &::selection
            color #eee
        &::placeholder
            color #aaa

</style>