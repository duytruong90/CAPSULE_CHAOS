import { Link } from 'react-router-dom';
import { GameStage } from '../components/GameStage/GameStage';
import styles from './NotFoundPage.module.css';

export function NotFoundPage() {
  return (
    <GameStage label="Page not found">
      <section className={styles.page}>
        <p className="eyebrow">Capsule lost</p>
        <h1>404</h1>
        <p>This route is outside the game stage.</p>
        <Link className="button buttonPrimary" to="/setup">
          Return to setup
        </Link>
      </section>
    </GameStage>
  );
}
