/* global clipboard */
/* eslint-disable no-console */

function addCopyButtons(clipboard) {
    console.log(document.querySelectorAll('pre > code'))
    document.querySelectorAll('pre > code').forEach(function(codeBlock) {
        console.log('found')
        var button = document.createElement('button');
        button.className = 'copy-code-button';
        button.type = 'button';
        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
        button.setAttribute('aria-label', 'Copy code to clipboard');
        button.setAttribute('title', 'Copy code to clipboard');

        button.addEventListener('click', function() {
            clipboard.writeText(codeBlock.textContent).then(
                function() {
                    /* Chrome doesn't seem to blur automatically, leaving the button
                       in a focused state */
                    button.blur();

                    // Add a success class to show feedback
                    button.classList.add('success');
                    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"></path></svg>';
                    
                    setTimeout(function() {
                        button.classList.remove('success');
                        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
                    }, 2000);
                },
                function(error) {
                    button.classList.add('error');
                    button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
                    console.error(error);
                    
                    setTimeout(function() {
                        button.classList.remove('error');
                        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
                    }, 2000);
                }
            );
        });

        var pre = codeBlock.parentNode;
        if (pre.parentNode.classList.contains('highlight')) {
            var highlight = pre.parentNode;
            // Insert the button as the first child of the highlight element
            highlight.insertBefore(button, highlight.firstChild);
            
            // Make sure the highlight has position relative for absolute positioning
            highlight.style.position = 'relative';
        } else {
            // Insert the button as the first child of the pre element
            pre.insertBefore(button, pre.firstChild);
            
            // Make sure the pre has position relative for absolute positioning
            pre.style.position = 'relative';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
   if (navigator && navigator.clipboard) {
       addCopyButtons(navigator.clipboard);
   } else {
       var script = document.createElement('script');
       script.src =
           'https://cdnjs.cloudflare.com/ajax/libs/clipboard-polyfill/2.7.0/clipboard-polyfill.promise.js';
       script.integrity = 'sha256-waClS2re9NUbXRsryKoof+F9qc1gjjIhc2eT7ZbIv94=';
       script.crossOrigin = 'anonymous';

       script.onload = function() {
           addCopyButtons(clipboard);
       };

       document.body.appendChild(script);
   }
});