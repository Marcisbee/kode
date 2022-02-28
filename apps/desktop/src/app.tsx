import { useStore } from 'exome/preact';

import { EditorComponent } from './features/editor/editor';
import { Files } from './features/files/files';
import { Welcome } from './features/welcome/welcome';
import { store } from './store';

export function App() {
  const { workspace } = useStore(store);

  if (!workspace) {
    return <Welcome />;
  }

  return (
    <>
      <div id="left">
        <Files />
      </div>

      <div id="content">
        <div id="tabs">
          <ul>
            <li>main.ts</li>
          </ul>
        </div>

        <EditorComponent />
      </div>
    </>
  );
}
