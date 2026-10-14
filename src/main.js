import App from './App.svelte';
import './styles/global.css';
import { startUpdateChecker } from './updateChecker';

const app = new App({
  target: document.getElementById('app')
});

export default app;

startUpdateChecker();
