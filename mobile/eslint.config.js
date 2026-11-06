const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', '.expo/*'] },
  {
    rules: {
      // Aturan React Compiler yang baru; pola "reset state saat efek mulai" masih dipakai di beberapa layar.
      // Tetap tampil sebagai peringatan sampai efek-efek itu dirapikan dan bisa diuji di perangkat.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);
