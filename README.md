# PHYS 790D · Beam Transport Lab

Interactive, browser-based electron beam transport for **Experimental Beam Diagnostics and Data Analysis**. Plain HTML/CSS/JavaScript; no build, backend, or external runtime dependencies.

## Open the simulator

Enable GitHub Pages once: **Settings → Pages → Build and deployment → Deploy from a branch → main → / (root) → Save**. Once GitHub finishes deployment, open <https://gwanghuiha.github.io/790D/>.

For offline use, download the repository ZIP, extract it, and open `index.html` in a modern browser. Keep `index.html`, `app.js`, `physics.js`, and `style.css` together.

## Instructor workflow

1. Click **Instructor**. The initial passcode is **`790D`**.
2. Set the beam energy, normalized transverse RMS emittances and Twiss parameters, bunch length, uncorrelated momentum spread, particle count, and random seed. Click **Apply beam settings**.
3. Optionally set the longitudinal polynomial coefficients. With `u = z / (1 mm)`, the initial correlation is `delta = delta_uncorr + a1*u + a2*u^2 + a3*u^3 + a4*u^4`. Coefficients describe fractional momentum deviation, not percent. For example, `a1 = 0.01` gives a 1% momentum change at z = +1 mm.
4. Build a starting lattice if desired. Use **Change passcode** to choose a classroom passcode. This changes the current experiment, not every existing link.
5. Click **Student link**, then distribute that link. It carries the chosen beam, starting lattice, screen settings, and passcode hash; it opens with beam controls and initial phase-space plots hidden.
6. Save an **instructor experiment** JSON to retain the complete setup. To restore it, unlock Instructor mode and use **Load experiment**.

The instructor gate is a classroom UI restriction, as requested. Beam generation and transport run in the browser; this is not a server-side secrecy or authentication system. Do not use a passcode reused for a real account. The default distribution in the repository changes only when source code is changed; instructor edits are distributed through student links or instructor experiment files.

## Student workflow

- Add, remove, and edit drifts, quadrupoles, horizontal dipoles, transverse deflecting cavities, and x/y slits.
- Positions are **element entrances**, measured as path length along the reference orbit. Gaps are automatically filled by drifts. Elements cannot overlap. The lattice drawing is a schematic along path length, not a floor-plan view.
- Edit properties and click **Apply element**. Pressing Enter in an element input also applies it.
- Move the virtual screen using its position field and **Apply screen settings**, the slider, or a click on the envelope. Set the desired distance beyond the screen independently.
- View the RMS x/y envelope, x–y screen image, x/y profiles, RMS sizes, surviving macroparticle count, and transmission relative to the generated population.
- **Save beamline** and **Load beamline** handle the lattice and screen, without exporting or altering the beam. Each browser works independently. A session snapshot is retained; opening/reloading an experiment link reapplies its starting configuration. Save JSON for durable work.
- **Reset lattice** returns to the configuration at page startup, leaving the current beam unchanged.

## Physics and conventions

Coordinates are `[x, xprime, y, yprime, z, delta]`, in m, rad, m, rad, m, and fractional momentum deviation. Positive z is toward the bunch head; positive delta is higher momentum. Electron energy is kinetic energy in MeV. Transverse normalized emittances are in mm·mrad. Generated macroparticles are equally weighted; they do not represent an absolute current calibration.

- **Drift:** transverse drift and first-order velocity slip `R56 = L/gamma^2`.
- **Quadrupole:** exact thick focusing/defocusing matrices; positive gradient focuses x. Strength uses the reference electron magnetic rigidity. Includes drift-like longitudinal velocity slip.
- **Dipole:** horizontal sector-body matrix with editable body angle and independent hard-edge entrance/exit angles. Includes dispersion, transverse/path-length coupling, geometric R56, and velocity slip. No combined-function gradient or fringe-gap correction. For a rectangular bend, set each edge to half the bend angle using the displayed signed convention. Edge angles remain independent when the body angle changes.
- **TDC:** uniform distributed, ultrarelativistic thick-cavity matrix. Set length L, zero-crossing strength kappa [1/m], x/y deflection, frequency [GHz], and phase [deg]. Defaults are 1.3 GHz and 0 degrees. At fixed kappa, the linear slope is `k = kappa*cos(phase)` and the centroid angular kick is `b = kappa*sin(phase)/kRF`, where `kRF = 2*pi*f/(beta*c)`. Frequency therefore changes the off-phase centroid kick at fixed kappa, while the zero-crossing slope remains fixed. A positive phase is defined to give a positive centroid kick for positive kappa.

  In the selected transverse plane u, the thick-cavity map is:

  ```text
  u_out      = u + L*uprime + (k*L/2)*z + b*L/2
  uprime_out = uprime + k*z + b
  z_out      = z
  delta_out  = delta + k*u + (k*L/2)*uprime + (k*k*L/6)*z + k*b*L/6
  ```

  The other transverse plane drifts through L. This includes the reciprocal longitudinal kick and the thick-cavity `k^2 L/6` term. It is not a thin kick or a drift–thin-kick–drift approximation. Velocity slip within the cavity, detailed cavity cell geometry, and RF curvature are neglected. At nonzero phase the map is affine (linear matrix plus centroid offset). It remains a first-order expansion about the fixed reference particle at z = 0, rather than a relinearization about each particle or the evolving bunch centroid.
- **Slit:** a zero-length absorbing aperture limiting x or y, with full opening and center in mm. Downstream statistics use only transmitted particles. No scattering, diffraction, or material interactions.
- **Screen:** an ideal non-intercepting measurement at any path length, including inside a finite element. At a slit position it reports the post-aperture population. Elements beyond the screen still act on the plotted extension, without changing the already measured screen population.

Transport is first order; only the **initial** longitudinal correlation can be nonlinear. No space charge, CSR, wakefields, chromatic/nonlinear focusing, RF curvature, or detector-resolution model is included. RMS sizes are centered on the surviving beam centroid, using population normalization. The initial particle sample is fixed while tuning the lattice. Screen RMS and transmission use all particles at the screen even when a manually selected image range clips the display; the number within image bounds is shown separately. With zero surviving particles, RMS is undefined and displayed as a dash.

The thick-cavity convention is consistent with the standard distributed-deflector map discussed in [General Solutions for a Transverse to Longitudinal Emittance Exchange Beamline](https://beamdocs.fnal.gov/AD/DocDB/0025/002553/002/EmitExch_Updated.pdf).

## Validation

Run `node physics.test.js` (Node.js 18+). The 17 checks cover reference rigidity, symplecticity, limiting maps, dipole dispersion and edges, thick-TDC coupling and affine composition, frequency/phase behavior, reproducible polynomial chirp, slit cuts, centered RMS, screen positioning, full particle loss, and invalid inputs.

Browser checks exercised instructor unlock, slit creation/editing, screen measurements before and after the slit, and student JSON export. Browser upload approval was declined, so the file-picker load round trip was not verified in that browser session.

## Files

- `index.html`: page structure
- `style.css`: responsive interface
- `app.js`: editor, plotting, instructor controls, share links, save/load
- `physics.js`: independent 6D transport engine
- `physics.test.js`: analytic and behavioral validation

No packages or installation are needed to run the simulator.
