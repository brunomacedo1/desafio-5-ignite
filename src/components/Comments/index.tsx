// eslint-disable-next-line no-use-before-define
import React, { Component } from 'react';

export default class Comments extends Component {
  componentDidMount(): void {
    const script = document.createElement('script');
    const anchor = document.getElementById('inject-comments-for-uterances');
    script.src = 'https://utteranc.es/client.js';
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.setAttribute('repo', 'brunomacedo1/utterancebot');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', 'github-dark');
    anchor.appendChild(script);
  }

  render(): JSX.Element {
    return <div id="inject-comments-for-uterances" />;
  }
}
