// Miniature two-colour prints for the project index. The paper shows through
// the cuts and facets, so these need no image downloads or SVG filters.
const ink = "var(--print-ink)";
const shade = "var(--print-shade)";
const paper = "var(--print-paper)";
const brass = "var(--print-brass)";

function HouseSection() {
  return <>
    <path fill={ink} d="m5 64 60 12 49-20-60-12z" />
    <path fill={paper} d="m7 63 58 11 46-18-58-12z" stroke={ink} strokeWidth="1.7" />
    <path fill={shade} d="m27 42 23-23 21 22-2 24-43-8z" />
    <path fill={paper} d="m31 43 18-19 16 18-1 17-33-6z" />
    <path fill={brass} d="m67 42 31-13-1 24-29 12z" />
    <path fill={ink} d="m23 43 23-28 35-12 24 22-38 18-19-22-22 24z" />
    <path fill={brass} d="m50 16 30-10 20 18-31 14z" />
    <path d="m58 18 20-7m-14 13 21-8m-15 13 21-9m-18 13 24-10" stroke={ink} strokeWidth="1.8" />
    <path fill={ink} d="m29 43 33 6v3l-33-6zm16-5 3 1v18l-3-.5zm28 8 6-2-1 12-6 2zm11-5 7-3v7l-7 3z" />
    <path fill="none" d="m30 58 32 6m13-3 17-7" stroke={paper} strokeWidth="1.2" />
  </>;
}

function Seismograph() {
  return <>
    <path fill={ink} d="M13 44q-6 9 0 14l59 14 34-17-1-6-62-13z" />
    <path fill={brass} d="m14 51 58 13 31-15-59-13z" stroke={ink} strokeWidth="2" />
    <path fill={shade} d="M36 21q0-9 8-10l49 10q13 4 10 15-2 10-10 12L45 35z" />
    <path fill={brass} d="M77 29q3-10 13-7 11 3 8 14-2 8-10 8-9 1-13-5z" stroke={ink} strokeWidth="2.1" />
    <path fill="none" d="M85 28q9-3 10 6-1 6-7 6-6-1-4-6 1-4 5-2" stroke={ink} strokeWidth="2" />
    <path fill={paper} d="M40 14q-8 5-9 16l-5 10q-5 8-16 10l51 12q12-4 18-13l4-15q1-9 8-13z" stroke={ink} strokeWidth="2" />
    <path d="m31 32 47 11m-53-3 49 11m-55-3 48 11" stroke={shade} strokeWidth=".9" opacity=".45" />
    <path d="m33 30 4 1 3-4-2 13 6-13-2 20 7-15-1 9 5-3 5 2 3-5-1 15 6-10 6 2" fill="none" stroke={ink} strokeWidth="2.3" />
    <path d="m29 44-7 3m8-.5-4 2" stroke={brass} strokeWidth="1.8" />
  </>;
}

function HeartTrace() {
  return <>
    <path fill={brass} stroke={ink} strokeWidth="2" d="m55 29-1-11 4-5 6 2 3 11 3-4-2-9 8-2 3 7-3 15z" />
    <path fill={paper} stroke={ink} strokeWidth="2.3" d="M35 30q2-8 9-10l-4-7 6-3 6 6-1 8 7 5-15 11z" />
    <path fill={shade} stroke={ink} strokeWidth="2.4" d="M48 27c9-8 24-6 29 6 6 13 0 32-10 40-3 3-28-9-35-23-5-11 2-25 10-25z" />
    <path fill={brass} d="M58 34c6-3 13-2 16 5 3 13-3 24-8 30-6-6-11-15-11-22 0-5 1-9 3-13z" />
    <path fill="none" d="M38 40q10 15 14 17m-16-10 9 8m14-16q-4 10 1 18m-3-6 7 11" stroke={paper} strokeWidth="1.5" />
    <path d="M13 43h15l4-4 4 6h10l6-7 2 12 5-30 2 24 4-4 4 3h34" fill="none" stroke={paper} strokeWidth="5.5" />
    <path d="M13 43h15l4-4 4 6h10l6-7 2 12 5-30 2 24 4-4 4 3h34" fill="none" stroke={ink} strokeWidth="2.1" />
    <circle cx="103" cy="43" r="2.7" fill={brass} stroke={ink} strokeWidth="1.6" />
  </>;
}

function StudentLedger() {
  return <>
    <path fill={ink} d="m12 30 42-14 51 15-12 29-41 12L7 54z" />
    <path fill={brass} d="m11 47 41 14 44-15-4 12-40 12L9 54z" stroke={ink} strokeWidth="2" />
    <path fill={paper} d="M16 25q18-1 40 11 23-16 45-14l-8 30q-17 0-41 12-17-12-42-13z" stroke={ink} strokeWidth="2.1" />
    <path fill={shade} d="M17 24q18 0 39 11l-5 24q-13-9-39-12z" />
    <path d="M23 30q12 2 25 9m-26-3q13 2 22 8m-23-3q10 2 21 7" fill="none" stroke={paper} strokeWidth="1.5" />
    <path d="M62 38q12-7 27-9m-28 15q15-8 27-10m-28 15q14-8 27-10m-29 17q15-8 27-10" fill="none" stroke={ink} strokeWidth="1.5" />
    <path fill={brass} d="m75 27 9-2-6 21-2-4-6 5z" stroke={ink} strokeWidth="1.4" />
    <path d="m13 53 35 13m11-1 28-9" stroke={paper} strokeWidth="1.2" />
  </>;
}

function DecisionPlate() {
  return <>
    <path fill={ink} d="m12 52 24-40 71 12v5L83 70 12 57z" />
    <path fill={paper} stroke={ink} strokeWidth="2" d="m13 52 24-39 68 12-23 40z" />
    <path fill={brass} d="m43 56 6-11 8 1 4-9 9 1 2-7 8-1 3-8 20 4-22 37z" />
    <path d="m44 55 6-11 7 1 4-9 8 1 2-7 8-1 4-8" fill="none" stroke={ink} strokeWidth="2.4" />
    <g fill={shade}>
      <circle cx="32" cy="44" r="2.8"/><circle cx="39" cy="34" r="2.6"/><circle cx="46" cy="43" r="2.4"/>
      <circle cx="50" cy="26" r="2.4"/><circle cx="54" cy="35" r="2.5"/><circle cx="64" cy="28" r="2.2"/>
    </g>
    <g fill={paper} stroke={ink} strokeWidth="1.6">
      <circle cx="61" cy="52" r="2.6"/><circle cx="71" cy="47" r="2.6"/><circle cx="78" cy="55" r="2.5"/>
      <circle cx="83" cy="40" r="2.7"/><circle cx="91" cy="32" r="2.5"/>
    </g>
    <path d="m19 55 15 3m2 .5 4 1M86 64l11-19" stroke={paper} strokeWidth="1.3" />
  </>;
}

function VaultDoor() {
  return <>
    <path fill={shade} stroke={ink} strokeWidth="2.4" d="m31 18 16-6 42 8 1 45-14 7-47-10z" />
    <path fill={brass} stroke={ink} strokeWidth="2.1" d="m31 18 45 9v44l-46-9z" />
    <path d="m80 28 6-3m-6 9 6-3m-6 30 6-3" stroke={paper} strokeWidth="1.5" />
    <ellipse cx="52" cy="44" rx="17" ry="19" transform="rotate(-26 52 44)" fill={ink} />
    <ellipse cx="52" cy="43" rx="13" ry="15" transform="rotate(-26 52 43)" fill={shade} stroke={paper} strokeWidth="1.4" />
    <path d="m51 43-6-10m7 10 9-2m-10 2-2 12" stroke={ink} strokeWidth="4.8" strokeLinecap="round" />
    <path d="m51 42-6-10m7 10 9-2m-10 2-2 12" stroke={brass} strokeWidth="2.8" strokeLinecap="round" />
    <circle cx="51" cy="42" r="3.7" fill={brass} stroke={ink} strokeWidth="1.5" />
    <path d="m29 28 6 1v8l-6-1zm0 20 6 1v8l-6-1z" fill={paper} stroke={ink} strokeWidth="1.5" />
    <path d="m67 32 4 1m-4 28 4 1" stroke={ink} strokeWidth="2.4" />
  </>;
}

function FileFolder() {
  return <>
    <path fill={shade} stroke={ink} strokeWidth="2.3" d="m19 30 3-12 18-3 7 5 41-7 7 36-12 12-54 9z" />
    <path fill={paper} stroke={ink} strokeWidth="2" d="m30 24 43-9 9 6 7 28-51 12z" />
    <path fill={brass} stroke={ink} strokeWidth="1.7" d="m73 15 2 9 8-3z" />
    <path fill={paper} stroke={ink} strokeWidth="1.8" d="m39 31 47-8 6 27-47 10z" />
    <path d="m45 35 25-5m-24 10 31-6" stroke={shade} strokeWidth="1.6" />
    <path fill={brass} stroke={ink} strokeWidth="2.3" d="m26 42 18-4 5 2 53-11-10 31-64 12z" />
    <path fill={ink} d="m28 70-5-23 3-4 3 9 2 16 59-11 8-25 3-.5-9 30-64 12z" />
    <path d="m39 49 16-3m-16 6 7-1m32 10 12-3" stroke={paper} strokeWidth="1.6" />
  </>;
}

const studies = {
  "01": HouseSection, "02": Seismograph, "03": HeartTrace, "04": StudentLedger,
  "05": DecisionPlate, "06": VaultDoor, "07": FileFolder,
};

export default function StudyObject({ id }: { id: string }) {
  const ObjectPrint = studies[id as keyof typeof studies];
  if (!ObjectPrint) return null;
  return <svg className="study-object" viewBox="0 0 116 80" aria-hidden="true" focusable="false"
    strokeLinejoin="round" strokeLinecap="round">
    <ObjectPrint />
  </svg>;
}
