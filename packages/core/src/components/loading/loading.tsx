import { Component, Listen, Prop, State } from '@stencil/core';
import { AnimationBuilder, Animation, Ionic } from '../../index';

import iOSEnterAnimation from './animations/ios.enter';
import iOSLeaveAnimation from './animations/ios.leave';


@Component({
  tag: 'ion-loading',
  styleUrls: {
    ios: 'loading.ios.scss',
    md: 'loading.md.scss',
    wp: 'loading.wp.scss'
  },
  host: {
    theme: 'loading'
  }
})
export class Loading {
  $el: HTMLElement;
  $emit: Function;
  animation: Animation;
  durationTimeout: any;

  @Prop() cssClass: string;
  @Prop() content: string;
  @Prop() dismissOnPageChange: boolean = false;
  @Prop() duration: number;
  @Prop() enterAnimation: AnimationBuilder;
  @Prop() exitAnimation: AnimationBuilder;
  @Prop() id: string;
  @State() showSpinner: boolean = null;
  @State() spinner: string;
  @Prop() showBackdrop: boolean = true;


  @Listen('ionDismiss')
  onDismiss(ev: UIEvent) {
    ev.stopPropagation();
    ev.preventDefault();

    this.dismiss();
  }

  ionViewDidLoad() {
    if (!this.spinner) {
      this.spinner = Ionic.config.get('loadingSpinner', Ionic.config.get('spinner', 'lines'));
    }

    if (this.showSpinner === null || this.showSpinner === undefined) {
      this.showSpinner = !!(this.spinner && this.spinner !== 'hide');
    }
    this.$emit('ionLoadingDidLoad', { loading: this } as LoadingEvent);
  }

  ionViewDidEnter() {
    // blur the currently active element
    const activeElement: any = document.activeElement;
    activeElement && activeElement.blur && activeElement.blur();

    // If there is a duration, dismiss after that amount of time
    if (typeof this.duration === 'number' && this.duration > 10) {
      this.durationTimeout = setTimeout(() => this.dismiss(), this.duration);
    }

    this.$emit('ionLoadingDidPresent', { loading: this } as LoadingEvent);
  }

  present() {
    return new Promise<void>(resolve => {
      this._present(resolve);
    });
  }

  private _present(resolve: Function) {
    if (this.animation) {
      this.animation.destroy();
      this.animation = null;
    }

    this.$emit('ionLoadingWillPresent', { loading: this } as LoadingEvent);

    // get the user's animation fn if one was provided
    let animationBuilder = this.enterAnimation;

    if (!animationBuilder) {
      // user did not provide a custom animation fn
      // decide from the config which animation to use
      // TODO!!
      animationBuilder = iOSEnterAnimation;
    }

    // build the animation and kick it off
    this.animation = animationBuilder(this.$el);

    this.animation.onFinish((a: any) => {
      a.destroy();
      this.ionViewDidEnter();
      resolve();
    }).play();
  }

  dismiss() {
    clearTimeout(this.durationTimeout);

    if (this.animation) {
      this.animation.destroy();
      this.animation = null;
    }

    return new Promise<void>(resolve => {
      this.$emit('ionLoadingWillDismiss', { loading: this } as LoadingEvent);

      // get the user's animation fn if one was provided
      let animationBuilder = this.exitAnimation;

      if (!animationBuilder) {
        // user did not provide a custom animation fn
        // decide from the config which animation to use
        // TODO!!
        animationBuilder = iOSLeaveAnimation;
      }

      // build the animation and kick it off
      this.animation = animationBuilder(this.$el);
      this.animation.onFinish((a: any) => {
        a.destroy();
        this.$emit('ionLoadingDidDismiss', { loading: this } as LoadingEvent);
        Ionic.dom.write(() => {
          this.$el.parentNode.removeChild(this.$el);
        });
        resolve();
      }).play();
    });
  }

  ionViewDidUnload() {
    this.$emit('ionLoadingDidUnload', { loading: this }as LoadingEvent);
  }

  render() {
    let userCssClass = 'loading-content';
    if (this.cssClass) {
      userCssClass += ' ' + this.cssClass;
    }

    const loadingInner: any[] = [];

    if (this.showSpinner) {
      loadingInner.push(
        <div class='loading-spinner'>
          <ion-spinner name={this.spinner}></ion-spinner>
        </div>
      );
    }

    if (this.content) {
      loadingInner.push(
        <div class='loading-content'>
          {this.content}
        </div>
      );
    }

    return [
      <ion-gesture
        attachTo='parent'
        autoBlockAll
        class={{
          'loading-backdrop': true,
          'hide-backdrop': !this.showBackdrop
        }}
      ></ion-gesture>,
      <div class='loading-wrapper' role='dialog'>
        {loadingInner}
      </div>
    ];
  }
}


export interface LoadingOptions {
  spinner?: string;
  content?: string;
  cssClass?: string;
  showBackdrop?: boolean;
  dismissOnPageChange?: boolean;
  duration?: number;
}


export interface LoadingEvent {
  loading: Loading;
}
