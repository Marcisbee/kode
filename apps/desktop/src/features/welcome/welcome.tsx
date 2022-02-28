import { store } from '../../store';
import { Workspace } from '../../store/workspace';

export function Welcome() {
  function onClick(e: MouseEvent) {
    const target = e.target as HTMLButtonElement;

    Promise.resolve()
      .then(() => target.disabled = true)
      .then(() => Neutralino.os.showFolderDialog('Choose root of a project'))
      .then((path) => {
        if (path) {
          store.setWorkspace(new Workspace(path));
        }
      })
      .then(() => target.disabled = false)
  }

  return (
    <div>
      <button onClick={onClick}>Select project</button>
    </div>
  );
}
