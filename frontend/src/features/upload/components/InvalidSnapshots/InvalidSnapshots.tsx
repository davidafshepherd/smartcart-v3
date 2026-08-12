import { XIcon } from '@/components/common/icons';

import type { InvalidSnapshot } from '@/types';

import './InvalidSnapshots.css';


interface Props {
  snapshots: InvalidSnapshot[];
  onDismiss: () => void;
}


export function InvalidSnapshots({ snapshots, onDismiss }: Props) {
  return (
    <div className="invalid-snapshots">
      {/* Dismiss Invalid Snapshot Warning button */}
      <button className="dismiss-button" onClick={onDismiss} aria-label="Dismiss">
        <XIcon className="dismiss-button-icon" />
      </button>

      {/* Number of invalid snapshots skipped */}
      <h3>{snapshots.length} invalid snapshot{snapshots.length > 1 ? "s" : ""} skipped.</h3>

      {/* List of invalid snapshots with folder name and validation error*/}
      <ul className="invalid-snapshot-list">
        {snapshots.map((entry, index) => (
          <li className="invalid-snapshot-item" key={index}>
            <span className="invalid-snapshot-text">{entry.folder}</span>: {entry.error}
          </li>
        ))}
      </ul>
    </div>
  );
}
