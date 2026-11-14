"""Rebuild the bundled Ink Observatory atlas. Requires Python, NumPy, scikit-learn and Node >=22.13.

Data: E. Alpaydin & C. Kaynak (1998), Optical Recognition of Handwritten Digits,
UCI Machine Learning Repository, https://doi.org/10.24432/C50P49, CC BY 4.0.
This trains on a fresh stratified split of sklearn's 1,797-image copy of optdigits.tes.
The held-out images never participate in clustering or prototype selection.
"""
import json
from pathlib import Path
import subprocess

import numpy as np
from sklearn.cluster import KMeans
from sklearn.datasets import load_digits
from sklearn.model_selection import train_test_split
from threadpoolctl import threadpool_limits

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'app' / 'ink-prototypes.json'
SEED = 173
PER_CLASS = 24


def normalized_digits(images):
    # Import the standalone shipping pixel transform, including when building a fresh atlas.
    runner = """
        import {readFileSync} from 'node:fs';
        import {normalizeInk} from './app/ink-normalize.mjs';
        const images = JSON.parse(readFileSync(0,'utf8'));
        process.stdout.write(JSON.stringify(images.map(image=>normalizeInk(image,8).map(x=>Math.round(x*255)))));
    """
    result = subprocess.run(['node', '--input-type=module', '-e', runner], cwd=ROOT,
                            input=json.dumps(images.tolist()), text=True, capture_output=True, check=True)
    return np.array(json.loads(result.stdout), dtype=np.float64)


def main():
    digits = load_digits()
    normalized = normalized_digits(digits.data / 16)
    train, test = train_test_split(np.arange(len(normalized)), test_size=0.2,
                                   stratify=digits.target, random_state=SEED)
    groups = []
    with threadpool_limits(limits=1):
        for digit in range(10):
            members = train[digits.target[train] == digit]
            cluster = KMeans(n_clusters=PER_CLASS, n_init=10, random_state=SEED).fit(normalized[members])
            representatives = []
            for index, center in enumerate(cluster.cluster_centers_):
                assigned = members[cluster.labels_ == index]
                nearest = np.argmin(((normalized[assigned] - center) ** 2).sum(axis=1))
                representatives.append(assigned[nearest])
            groups.append(representatives)
    ids = np.array(groups).flatten()
    assert len(set(ids)) == len(ids) and set(ids).isdisjoint(test)
    expected = digits.target[test]
    errors = ((normalized[test, None] - normalized[ids]) ** 2).sum(axis=2)
    ranked = np.argsort(errors.reshape(len(test), 10, PER_CLASS).min(axis=2), axis=1, kind='stable')
    predicted = ranked[:, 0]
    correct = int((predicted == expected).sum())

    def example(sample_id):
        raw = ''.join('0123456789abcdefg'[int(p)] for p in digits.data[sample_id])
        return {'digit': int(digits.target[sample_id]), 'raw': raw, 'datasetIndex': int(sample_id)}

    # The examples are illustrative; the reported score includes every held-out sample.
    examples = [example(test[(expected == digit) & (predicted == digit)][0]) for digit in (0, 2, 4, 7)]
    misread_index = np.flatnonzero((expected != predicted) & (ranked[:, 1] == expected))[0]
    misread = example(test[misread_index])
    model = {
        'info': {'trainCount': len(train), 'testCount': len(test), 'testCorrect': correct,
                 'prototypeCount': len(ids), 'sourceUrl': 'https://doi.org/10.24432/C50P49',
                 'licenseUrl': 'https://creativecommons.org/licenses/by/4.0/',
                 'attribution': 'E. Alpaydin & C. Kaynak (1998), UCI Optical Recognition of Handwritten Digits, CC BY 4.0'},
        'prototypes': [[normalized[index].astype(np.uint8).tobytes().hex() for index in group] for group in groups],
        'examples': examples, 'misread': misread,
    }
    OUT.write_text(json.dumps(model, separators=(',', ':')) + '\n')
    print(f'{correct}/{len(test)} held-out digits classified correctly; {len(ids)} prototypes; {OUT.stat().st_size} bytes.')


if __name__ == '__main__':
    main()
