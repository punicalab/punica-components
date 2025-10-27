(function () {
  const template = document.createElement('template');

  template.innerHTML = `
    <canvas></canvas>
    <style></style>
  `;

  class QRCode extends HTMLElement {
    #shadow = this.attachShadow({ mode: 'open' });
    #canvas;
    #ctx;

    /**
     *
     */
    get value() {
      return this.getAttribute('value') || '';
    }

    /**
     *
     */
    set value(val) {
      this.setAttribute('value', val);
    }

    /**
     *
     */
    get size() {
      return parseInt(this.getAttribute('size')) || 256;
    }

    /**
     *
     */
    set size(val) {
      this.setAttribute('size', val);
    }

    /**
     *
     */
    get background() {
      return this.getAttribute('background') || '#FFFFFF';
    }

    /**
     *
     */
    set background(val) {
      this.setAttribute('background', val);
    }

    /**
     *
     */
    get foreground() {
      return this.getAttribute('foreground') || '#000000';
    }

    /**
     *
     */
    set foreground(val) {
      this.setAttribute('foreground', val);
    }

    /**
     *
     */
    static get observedAttributes() {
      return ['value', 'size', 'background', 'foreground'];
    }

    /**
     * Constructor
     */
    constructor() {
      super();
    }

    /**
     * Attribute changed callback
     */
    attributeChangedCallback(name, oldValue, newValue) {
      if (oldValue !== newValue) {
        this.render();
      }
    }

    /**
     * Connected callback
     */
    connectedCallback() {
      this.#shadow.appendChild(template.content.cloneNode(true));
      this.#canvas = this.#shadow.querySelector('canvas');
      this.#ctx = this.#canvas.getContext('2d');
      this.render();
    }

    /**
     * Render QR code
     */
    render() {
      if (!this.#canvas || !this.value) return;

      const moduleSize = 8;
      const qrSize = 21;
      const quietZone = 4;
      const totalSize = (qrSize + 2 * quietZone) * moduleSize;

      this.#canvas.width = totalSize;
      this.#canvas.height = totalSize;

      this.#ctx.fillStyle = this.background;
      this.#ctx.fillRect(0, 0, totalSize, totalSize);

      const matrix = this.#createMatrix(qrSize);
      this.#drawMatrix(matrix, qrSize, quietZone, moduleSize);
    }

    /**
     * Create QR matrix
     */
    #createMatrix(size) {
      const matrix = Array(size)
        .fill()
        .map(() => Array(size).fill(false));

      this.#addFinderPattern(matrix, 0, 0);
      this.#addFinderPattern(matrix, size - 7, 0);
      this.#addFinderPattern(matrix, 0, size - 7);

      for (let i = 8; i < size - 8; i++) {
        matrix[6][i] = i % 2 === 0;
        matrix[i][6] = i % 2 === 0;
      }

      return matrix;
    }

    /**
     * Add finder pattern
     */
    #addFinderPattern(matrix, row, col) {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 ||
            r === 6 ||
            c === 0 ||
            c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            matrix[row + r][col + c] = true;
          }
        }
      }
    }

    /**
     * Draw matrix
     */
    #drawMatrix(matrix, size, quietZone, moduleSize) {
      this.#ctx.fillStyle = this.foreground;

      for (let row = 0; row < size; row++) {
        for (let col = 0; col < size; col++) {
          if (matrix[row][col]) {
            const x = (col + quietZone) * moduleSize;
            const y = (row + quietZone) * moduleSize;
            this.#ctx.fillRect(x, y, moduleSize, moduleSize);
          }
        }
      }
    }
  }

  customElements.define('punica-qr-code', QRCode);
})();
