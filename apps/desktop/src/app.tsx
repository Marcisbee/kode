import { EditorComponent } from './features/editor/editor';
import { Files } from './features/files/files';

export function App() {
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
