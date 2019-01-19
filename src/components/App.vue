<template lang="pug">
	.main
		.loading_bar(v-show="isLoading")
		.error_message(v-show='isError')
			h1 {{errorName}}
			p {{errorMessage}}
		.settings_block
			table
				tr
					td
						p count of accounts:
					td
						input(placeholder="count" v-model='count' type='text')
				tr
					td
						p path to save:
					td
						input(placeholder="type path for output files .txt" v-model='pathToOut' type='text')
				tr
					td
						p domains for mail:
					td
						input(placeholder="example: mail.ru,yandex.ru,gmail.com" v-model='domainMail' type='text')
				tr
					td
						p path to steam/userdata:
					td
						input(placeholder="" v-model='pathUserdata' type='text')
				tr
					td
						p path to settings:
					td
						input(placeholder="" v-model='pathSettings' type='text')
			.buttons
				.left
					button(@click='replaceSettings') userdata change
					button(@click='saveSettings') save
				.right
					button(@click='register') register
		.captcha_block
			div
				p remaining captcha:
					b {{count}}
				.captcha_image(:style='{backgroundImage:"url("+captchaImageUrl+")"}')
			input(type='text' placeholder='type and press enter' ref='capchaInput' :value='inputCaptcha' @keyup.enter='sendCaptcha' @input="inputCaptcha=($event.target.value+'').toUpperCase()")
			
</template>

<script lang="ts">
	import Vue from "vue";
	import Component from "vue-class-component";
	import * as fse from "fs-extra";
	import * as path from "path";
	import { app, BrowserWindow, ipcRenderer } from "electron";

	import { EventBus } from "@/EventBus";
	import ModalCaptcha from "./ModalCaptcha.vue";
	// import { setTimeout } from "timers";
	import SteamRegistrator from "@/SteamRegistrator";
	import Config from "@/Config";
	import Util from "@/Util";

	interface CacheSettings {
		pathToOut: string;
		domainMail: string;
		pathSettings: string;
		pathUserdata: string;
	}

	@Component({ props: {}, components: { ModalCaptcha } })
	export default class App extends Vue {
		inputCaptcha = "";
		captchaImageUrl = "";
		isLoading = false;
		count = "1";
		pathToOut = Config.DEFAULT_PATH_ACCOUNTS;
		isShowModal = false;
		domainMail = Config.DOMAIN_MAIL;
		isError = false;
		errorMessage = "message of error";
		errorName = "Name Error";
		pathSettings = "C:\\Program Files (x86)\\Steam\\userdata\\_";
		pathUserdata = "C:\\Program Files (x86)\\Steam\\userdata";

		steamRegistrator: SteamRegistrator = new SteamRegistrator([]);
		clearState() {
			this.inputCaptcha = "";
			this.captchaImageUrl = "";
			this.isLoading = false;
		}
		async saveSettings() {
			try {
				this.isLoading = true;
				let settings: CacheSettings = {
					pathToOut: this.pathToOut,
					domainMail: this.domainMail,
					pathSettings: this.pathSettings,
					pathUserdata: this.pathUserdata
				};
				await fse.writeJson(Config.CACHE_FILE, settings);
				this.isLoading = false;
			} catch (e) {
				this.clearState();
				this.errorMessage = e;
				this.errorName = "Error in register()";
				this.isError = true;
				await Util.sleep(5000);
				this.isError = false;
			}
		}

		async replaceSettings() {
			try {
				this.isLoading = true;
				let itemsInPath = await fse.readdir(this.pathUserdata);
				let needFolders = [];
				for (let item of itemsInPath) {
					if (
						(await fse.lstat(
							path.join(this.pathUserdata, item)
						)).isDirectory() &&
						!item.match(/^_.*$/)
					) {
						await fse.copy(
							this.pathSettings,
							path.join(this.pathUserdata, item)
						);
					}
				}
				this.isLoading = false;
			} catch (e) {
				this.clearState();
				this.errorMessage = e.toString();
				this.errorName = "Error in settings copy";
				this.isError = true;
				await Util.sleep(5000);
				this.isError = false;
			}
		}

		async register() {
			try {
				this.isLoading = true;
				this.steamRegistrator = new SteamRegistrator(
					this.domainMail.split(",")
				);
				let count = !!parseInt(this.count) ? this.count : 1;
				count = count < 1 ? 1 : count;
				this.count = count + "";
				this.captchaImageUrl = (await this.steamRegistrator.waitCaptcha()).user.srcImg;
				this.inputCaptcha = "";

				(this.$refs["capchaInput"] as HTMLElement).focus();
				this.isLoading = false;
			} catch (e) {
				this.clearState();
				this.errorMessage = e;
				this.errorName = "Error in register()";
				this.isError = true;
				await Util.sleep(5000);
				this.isError = false;
			}
		}

		async sendCaptcha() {
			try {
				this.isLoading = true;
				this.steamRegistrator.setCaptchaText(this.inputCaptcha);
				await this.steamRegistrator.checkCaptcha();
				this.inputCaptcha = "";
				this.captchaImageUrl = "";
				let registerResult = await this.steamRegistrator.approveMail();
				if (registerResult) {
					let dataAccount = `\n${this.steamRegistrator.user.login}:${
						this.steamRegistrator.user.password
					}:${this.steamRegistrator.user.mail}`;
					await fse.appendFile(this.pathToOut, dataAccount);
					this.count = parseInt(this.count) - 1 + "";
				} else {
					throw "register result is FALSE";
				}
				if (parseInt(this.count) > 0) this.register();
				this.isLoading = false;
			} catch (e) {
				this.clearState();
				this.errorMessage = e;
				this.errorName = "Error in sendCaptcha()";
				this.isError = true;
				await Util.sleep(5000);
				this.isError = false;
			}
		}

		async setInitFromCache() {
			try {
				let cch: CacheSettings = await fse.readJson(Config.CACHE_FILE);
				this.pathToOut = cch.pathToOut ? cch.pathToOut : this.pathToOut;
				this.domainMail = cch.domainMail ? cch.domainMail : this.domainMail;
				this.pathSettings = cch.pathSettings
					? cch.pathSettings
					: this.pathSettings;
				this.pathUserdata = cch.pathUserdata
					? cch.pathUserdata
					: this.pathUserdata;
			} catch (e) {
				console.log(e);
			}
		}

		mounted() {
			this.setInitFromCache();
			EventBus.$on("loading:start", () => {
				this.isLoading = true;
			});
			EventBus.$on("loading:stop", () => {
				this.isLoading = false;
			});
		}
	}
</script>

<style lang="stylus" scoped>
	.error_message
		position fixed
		bottom 0
		left 0
		width 100%
		min-height 100px
		max-height 50%
		padding 0 10px

		border-top 1px solid #f00
		background rgba(#200, 0.95)
		h1
			font-size 25px
		p 
			font-size 12px
	.buttons
		display flex
		justify-content space-between
		width 100%
		align-items center
		.left, .right
			display flex
			button
				height auto
				min-height auto
				min-width auto
				width auto
				padding 5px 10px
				font-size 15px
		.left
			justify-content flex-start
		.right
			justify-content flex-end
			button
				padding 5px 10px
				font-size 15px
				border-bottom 1px solid rgb(255, 136, 0)
		button
			margin-right 1px
	table
		border-collapse separate
		border-spacing 0 1px
		width 100%
	td
		text-align right
		input
			width 100%
	td
		padding-left 15px

	tr:nth-child(odd)
		td
			background rgba(#fff,0.02)

	td:first-child
		text-align left

	.main
		height 100vh
		width 100%
		padding 10px
		display flex
		align-items center
	p
		color #eee
		font-size 15px
	.settings_block
		flex-grow 1
		display flex
		align-items center
		justify-content center
		flex-direction column
		margin 20px
		input
			width 250px
			height 30px
			padding 5px 10px
			margin-left 1px
		button
			padding 5px 10px
			width 120px
			height 30px
			margin-top 10px
		

	.captcha_block
		width 350px
		height 150px
		background #eee
		padding 20px 30px
		display flex
		align-self center
		flex-direction column
		justify-content space-between
		margin-left 10px
		border-radius 4px
		p 
			color #555
			text-align center

		input
			width 100%
			height auto
			text-align center
			background #eee
			color #555
			font-size 15px
			text-transform uppercase
			border-bottom 1px solid #0af
			&::selection
				color #eee
			&::placeholder
				color #aaa
			
	.captcha_image
		// width 80%
		background-color #fff
		background-position 50% 50%
		background-repeat no-repeat
		background-size contain
		min-height 40px
		margin-top 10px
		flex-grow 0
		flex-shrink 0

	.loading_bar
		top 0
		left 0
		height 3px
		width 100%
		position fixed
		background-color rgb(0, 119, 255)

	.starting_container
		margin auto
		margin-top 50px
		width 50%
		display flex
		align-items stretch
		flex-direction row
		justify-content center
		*
			flex-shrink 0
			flex-grow 0
		input
			flex-grow 1
			border-radius 4px 0 0 4px
		button
			border-radius 0 4px 4px 0

	.settings_container
		margin auto
		margin-top 5px
		width 50%
		display flex
		align-items center
		// align-content center
		flex-direction row
		justify-content center
		*
			flex-shrink 0
			flex-grow 0
		input
			flex-grow 1
			border-radius 4px
			padding 15px 25px
			min-height 0
			height auto

		p 
			margin-right 20px

</style>