# Vista Oculta — Blog autónomo

Blog em HTML/CSS/JS puro. Admin separado, com login. Deploy em qualquer hosting estático.

## 🔐 Password do admin

Por omissão: **`vistaoculta2026`**

Para mudar, abre o ficheiro `assets/admin.js` e altera a constante `GATE_B64`:

```js
// No browser, abre a consola (F12) e escreve:
btoa('aminhaNovaPassword')
// Copia o resultado e cola em GATE_B64