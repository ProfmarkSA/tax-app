const SVG_Copy = `<svg fill="#000000" height="22px" width="22px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 352.804 352.804" xml:space="preserve"><path d="M318.54,57.282h-47.652V15c0-8.284-6.716-15-15-15H34.264c-8.284,0-15,6.716-15,15v265.522c0,8.284,6.716,15,15,15h47.651 v42.281c0,8.284,6.716,15,15,15H318.54c8.284,0,15-6.716,15-15V72.282C333.54,63.998,326.824,57.282,318.54,57.282z M49.264,265.522V30h191.623v27.282H96.916c-8.284,0-15,6.716-15,15v193.24H49.264z M303.54,322.804H111.916V87.282H303.54V322.804	z"></path></svg>`

export const FeedbackExtension = {
  name: 'Copy',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_copy' || trace.payload.name === 'ext_copy',
  render: ({ trace, element }) => {
    const feedbackContainer = document.createElement('div')
	
	const KB_response = trace.payload

  ;function markdown(src) {

    var rx_lt = /</g;
    var rx_gt = />/g;
    var rx_space = /\t|\r|\uf8ff/g;
    var rx_escape = /\\([\\\|`*_{}\[\]()#+\-~])/g;
    var rx_hr = /^([*\-=_] *){3,}$/gm;
    var rx_blockquote = /\n *&gt; *([^]*?)(?=(\n|$){2})/g;
    var rx_list = /\n( *)(?:[*\-+]|((\d+)|([a-z])|[A-Z])[.)]) +([^]*?)(?=(\n|$){2})/g;
    var rx_listjoin = /<\/(ol|ul)>\n\n<\1>/g;
    var rx_highlight = /(^|[^A-Za-z\d\\])(([*_])|(~)|(\^)|(--)|(\+\+)|`)(\2?)([^<]*?)\2\8(?!\2)(?=\W|_|$)/g;
    var rx_code = /\n((```|~~~).*\n?([^]*?)\n?\2|((    .*?\n)+))/g;
    var rx_link = /((!?)\[(.*?)\]\((.*?)( ".*")?\)|\\([\\`*_{}\[\]()#+\-.!~]))/g;
    var rx_table = /\n(( *\|.*?\| *\n)+)/g;
    var rx_thead = /^.*\n( *\|( *\:?-+\:?-+\:? *\|)* *\n|)/;
    var rx_row = /.*\n/g;
    var rx_cell = /\||(.*?[^\\])\|/g;
    var rx_heading = /(?=^|>|\n)([>\s]*?)(#{1,6}) (.*?)( #*)? *(?=\n|$)/g;
    var rx_para = /(?=^|>|\n)\s*\n+([^<]+?)\n+\s*(?=\n|<|$)/g;
    var rx_stash = /-\d+\uf8ff/g;

    function replace(rex, fn) {
        src = src.replace(rex, fn);
    }

    function element(tag, content) {
        return '<' + tag + '>' + content + '</' + tag + '>';
    }

    function blockquote(src) {
        return src.replace(rx_blockquote, function(all, content) {
            return element('blockquote', blockquote(highlight(content.replace(/^ *&gt; */gm, ''))));
        });
    }

    function list(src) {
        return src.replace(rx_list, function(all, ind, ol, num, low, content) {
            var entry = element('li', highlight(content.split(
                RegExp('\n ?' + ind + '(?:(?:\\d+|[a-zA-Z])[.)]|[*\\-+]) +', 'g')).map(list).join('</li><li>')));

            return '\n' + (ol
                ? '<ol start="' + (num
                    ? ol + '">'
                    : parseInt(ol,36) - 9 + '" style="list-style-type:' + (low ? 'low' : 'upp') + 'er-alpha">') + entry + '</ol>'
                : element('ul', entry));
        });
    }

    function highlight(src) {
        return src.replace(rx_highlight, function(all, _, p1, emp, sub, sup, small, big, p2, content) {
            return _ + element(
                  emp ? (p2 ? 'strong' : 'em')
                : sub ? (p2 ? 's' : 'sub')
                : sup ? 'sup'
                : small ? 'small'
                : big ? 'big'
                : 'code',
                highlight(content));
        });
    }

    function unesc(str) {
        return str.replace(rx_escape, '$1');
    }

    var stash = [];
    var si = 0;

    src = '\n' + src + '\n';

    replace(rx_lt, '&lt;');
    replace(rx_gt, '&gt;');
    replace(rx_space, '  ');

    // blockquote
    src = blockquote(src);

    // horizontal rule
    replace(rx_hr, '<hr/>');

    // list
    src = list(src);
    replace(rx_listjoin, '');

    // code
    replace(rx_code, function(all, p1, p2, p3, p4) {
        stash[--si] = element('pre', element('code', p3||p4.replace(/^    /gm, '')));
        return si + '\uf8ff';
    });

    // link or image
    replace(rx_link, function(all, p1, p2, p3, p4, p5, p6) {
        stash[--si] = p4
            ? p2
                ? '<img src="' + p4 + '" alt="' + p3 + '"/>'
                : '<a href="' + p4 + '">' + unesc(highlight(p3)) + '</a>'
            : p6;
        return si + '\uf8ff';
    });

    // table
    replace(rx_table, function(all, table) {
        var sep = table.match(rx_thead)[1];
        return '\n' + element('table',
            table.replace(rx_row, function(row, ri) {
                return row == sep ? '' : element('tr', row.replace(rx_cell, function(all, cell, ci) {
                    return ci ? element(sep && !ri ? 'th' : 'td', unesc(highlight(cell || ''))) : ''
                }))
            })
        )
    });

    // heading
    replace(rx_heading, function(all, _, p1, p2) { return _ + element('h' + p1.length, unesc(highlight(p2))) });

    // paragraph
    replace(rx_para, function(all, content) { return element('p', unesc(highlight(content))) });

    // stash
    replace(rx_stash, function(all) { return stash[parseInt(all)] });

    return src.trim();
};

  const html = markdown(KB_response);

    feedbackContainer.innerHTML = ` 
          <style>
            .vfrc-feedback {
              display: flex;
              flex-direction: columm;
              justify-content: flex-start;
            }

            .vfec-feedback--btncontainer {
              display: flex;
              justify-content: flex-end;
            }

            .vfrc-feedback--button {
                margin: 0;
                padding: 5px;
                margin-left: 0px;
                border: none;
                background: none;
                opacity: 0.8;
            }

            .vfrc-feedback--button:hover {
              opacity: 0.5; /* opacity on hover */
            }

            .vfrc-feedback--button.selected {
              opacity: 0.6;
            }

            .tooltip {
              position: relative;
            }

            .tooltip .tooltiptext {
              visibility: hidden;
              width: 80px;
              background-color: black;
              opacity: 0.9;
              color: #fff;
              text-align: center;
              border-radius: 6px;
              padding: 4px 0;
              position: absolute;
              z-index: 1;
              top: 150%;
              left: 50%;
              margin-left: -60px;
            }

            .tooltip .tooltiptext::after {
              content: "";
              position: absolute;
              bottom: 100%;
              left: 75%;
              margin-left: -5px;
              border-width: 5px;
              border-style: solid;
              border-color: transparent transparent black transparent;
            }

            .tooltip:hover .tooltiptext {
              visibility: visible;
            }
          }

          </style>

          <div class="vfrc-feedback">
            <div>${html}<div>
            <div class="vfec-feedback--btncontainer">
              <div class="tooltip">
                <button class="vfrc-feedback--button">${SVG_Copy}</button>
                <span class="tooltiptext">Copy</span>
              </div>  
            </div>
          </div>
		  `        

    feedbackContainer
      .querySelectorAll('.vfrc-feedback--button')
      .forEach((button) => {

        button.addEventListener('click', () => {
          navigator.clipboard.writeText(KB_response)
        })
      })

    element.appendChild(feedbackContainer)
  },
}

export const DisclaimerExtension = {
  name: 'Disclaimer',
  type: 'response',
  match: ({ trace }) =>
    trace.type === 'ext_disclaimer' || trace.payload.name === 'ext_disclaimer',
  render: ({ trace, element }) => {
    const disclaimerContainer = document.createElement('div')

    const Disclaimer = trace.payload

    disclaimerContainer.innerHTML=`
    <style>
      .vfrc-disclaimer{
      color: #FF0000;
      }
    </style>
      <div class ="vfrc-disclaimer">
        ${Disclaimer}
      </div>
    `
	element.appendChild(disclaimerContainer)
  },
}