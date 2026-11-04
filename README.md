# PHYS 790D · Beam Transport Lab

Interactive, browser-based electron beam transport for **Experimental Beam Diagnostics and Data Analysis**. Plain HTML/CSS/JavaScript; no build, backend, or external runtime dependencies.

## Open the simulator

Enable GitHub Pages once: **Settings → Pages → Build and deployment → Deploy from a branch → main → / (root) → Save**. Once GitHub finishes deployment, open <https://gwanghuiha.github.io/790D/>.

For offline use, download the repository ZIP, extract it, and open `index.html` in a modern browser. Keep `index.html`, `app.js`, `physics.js`, `settings.js`, `presets.js`, `diagnostics.js`, and `style.css` together. File-based offline mode uses the built-in beam; the hosted page reads the published `defaults.json`.

## Lecture presets: prepare once, select during class

Students open **https://gwanghuiha.github.io/790D/** and use the **Lecture preset** selector. Selecting a published preset immediately loads its fixed initial beam and the student's workspace for that preset. No password, token, or publishing is needed during class. Students can edit the lattice and screen; the initial beam parameters and phase-space plots remain hidden.

The existing published beam/lattice becomes **Preset 1**, preserving its settings and instructor passcode.

### Prepare the collection privately before class

1. Unlock **Instructor** using your published passcode.
2. To create a preset, configure the beam, lattice, and screen, enter a unique **Preset name**, then click **Create from current setup**. This copies the current setup into a new preset.
3. Edit the selected preset and click **Save preset changes**. Use **Rename**, **Delete preset**, or **Set as opening default** as needed. At least one preset must remain; up to 50 are supported.
4. Repeat for the presets you need. Each stores a beam, starting beamline, screen position, and plot extension. The instructor passcode applies to the entire collection.
5. Click **Publish presets → Publish for all students** once. This publishes the entire collection, opening default, and passcode. Current beam-field changes are included for the selected preset. Apply lattice/screen edits first. Other presets contain the changes you previously saved.
6. After GitHub Pages deploys, students reload once. All published presets are then available immediately at the same short URL. They select the preset you assign and work with their own lattice.

Changing an existing preset or adding new presets for a future class requires publishing again. Switching among already published presets does not.

**Save experiment** backs up the full prepared preset collection, active setup, opening default, and passcode hash. **Load experiment** restores that backup in Instructor mode. It does not publish anything. Older single-experiment files remain compatible and import as one preset. Saved beamline files remain independent of the beam/preset selection.

Student beamline work is kept separately for each preset in browser session storage, so switching away and back restores their tuning. **Reset lattice** restores the selected preset's starting lattice and screen. A newly published revision starts fresh workspaces on reload; students can save their beamline JSON first if needed. Names appear in the student selector; choose names that identify the exercise without revealing its hidden beam values.

### Density profiles in all six normalized coordinates

Instructor mode includes a **Density profiles** table for x, x′, y, y′, z, and uncorrelated δ. Each row has:

- Gaussian or uniform component shape.
- Number of equal-population components (1–20).
- Center-to-center separation in units of the normalized coordinate's **total RMS**, rather than mm or mrad.

For n equally spaced components with separation d, the normalized component RMS is `sqrt(1 − d²(n² − 1)/12)`. For n > 1, separation must be less than `sqrt(12/(n² − 1))`; the table shows this limit and the resulting component width. One component ignores the separation field. Uniform means a one-dimensional flat-top component with half-width `sqrt(3)` times its component RMS, not a uniform transverse disk. Two Gaussian components at separation 1.8 total RMS, for example, each have RMS width about 0.436 total RMS.

The generator samples the chosen profiles, recenters them, and removes finite-sample correlations using modified Gram–Schmidt normalization. Their population covariance is the identity before the Twiss map. Consequently the specified transverse RMS emittances, beta and alpha, RMS bunch length, and uncorrelated momentum spread remain fixed when density profiles change. Small finite-sample corrections can slightly shift the nominal component spacings and reshape later normalized-coordinate marginals.

The x′ and y′ rows shape **intrinsic normalized divergence before the Twiss correlation**: `x′ = sqrt(epsilon/beta) * (p_normalized − alpha*x_normalized)`, and similarly in y. At nonzero alpha, the physical angular marginal also contains the chosen position distribution. These controls shape normalized phase-space density; they are not independent prescriptions for all correlated physical marginals.

The δ row shapes the uncorrelated momentum spread. The polynomial `delta += f(z)` is applied **after** profile normalization and the Twiss transformation, so it may change total energy spread, longitudinal covariance and mean momentum as intended. If uncorrelated RMS δ is zero, that profile has no effect until a nonzero spread is chosen.

Click **Apply beam settings** to preview the profiles, then **Save preset changes**. Profile settings are stored separately in each preset and included in experiment backups and **Publish presets**. Existing presets without a profile definition use a single Gaussian in each coordinate. Profile controls remain hidden in student mode. The random seed reproduces the shaped sample, and component populations differ by at most one particle when the total is not divisible by the component count.

### GitHub authorization for publishing

GitHub Pages serves static files. The classroom passcode unlocks the beam editor; writing shared defaults also requires authorization from GitHub.

Create a [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new) for owner **gwanghuiHa**, selecting only the **790D** repository, with **Contents: read and write** permission. Choose an expiration suitable for your use. Enter it in the simulator's publish dialog. No token is included in the code, repository, student URL, JSON exports, local storage, or session storage. It is sent only to `api.github.com` and retained in memory until you lock instructor mode or reload the page. A rejected/expired token is cleared. Never send it in chat.

Publishing updates only `defaults.json` on `main`, using its current GitHub blob SHA to detect conflicting changes. A successful save means the GitHub commit succeeded; Pages deployment follows separately. If another instructor publishes after your page loads, save your experiment, reload, load your experiment, and publish again.

### Local work and older links

- Preset/beam/passcode edits are local until **Publish presets** succeeds. Save an **instructor experiment** JSON for an independent backup.
- If you had a setup saved in the previous version's browser session, **Restore previous local setup** appears after unlocking Instructor mode. Restore it, save the preset, then publish the collection. The initial shared defaults otherwise match the original 44 MeV example.
- Students can tune their own lattice without changing the published beam. Their session lattices are restored only while the published revision matches. After a newly published revision is deployed, reloading uses the new shared setup; save a beamline JSON first if you want to retain your lattice.
- Previously generated long experiment links still work as fixed snapshots. Distribute the plain main URL for shared updates.
- If the published defaults cannot be loaded or validated online, the page displays an error instead of silently simulating a different beam. File-based offline use falls back to the built-in example; use the hosted page to obtain published defaults.

The instructor gate remains a classroom UI restriction, as requested. Beam generation and transport run in the browser. The shared passcode is stored as a hash; GitHub's write authorization controls who can publish changes.

## Student workflow

- Add, remove, and edit drifts, quadrupoles, horizontal dipoles, transverse deflecting cavities, and x/y slits.
- Positions are **element entrances**, measured as path length along the reference orbit. Gaps are automatically filled by drifts. Elements cannot overlap. The lattice drawing is a schematic along path length, not a floor-plan view.
- Edit properties and click **Apply element**. Pressing Enter in an element input also applies it.
- Move the virtual screen using its position field and **Apply screen settings**, the slider, or a click on the envelope. Set the desired distance beyond the screen independently.
- View the RMS x/y envelope, x–y screen image, x/y profiles, RMS sizes, surviving macroparticle count, and transmission relative to the generated population.
- **Save beamline** and **Load beamline** handle the lattice and screen, without exporting or altering the beam. Each browser works independently. Its lattice is retained for the current published revision; a new revision starts from the newly published setup on reload. Save JSON for durable work.
- **Reset lattice** returns to the selected preset’s starting lattice and screen, leaving the current beam unchanged.

## Screen display resolution

The x–y screen image uses **256 × 256** histogram bins by default; select 128 or 512 bins per axis to adjust resolution. The image keeps equal physical scales in x and y, and the optional image half-range applies to both. Histogram pixels are drawn as a raster without oversized overlapping bin rectangles or density smoothing.

Profiles default to **Auto per plane** ranges, so a narrow x profile is not compressed into a range chosen for a much larger y extent. Choose **Match image** to compare profiles over the same physical range as the image. Automatic profile bin counts use a Freedman–Diaconis IQR-based width (32–512 bins, with a Scott-rule fallback for zero IQR). Manual counts are also available. Profiles show histogram steps, without smoothing, so multiple peaks and gaps remain visible. The note below the plots reports bin counts and physical bin widths.

These controls affect display only. RMS sizes, centroids, transmission and particle tracking always use the original unbinned particle coordinates. Particle counts include histogram upper boundaries, and manually clipping the image does not exclude particles from the RMS calculation. Display settings do not alter saved presets or beamline files.

## Physics and conventions

Coordinates are `[x, xprime, y, yprime, z, delta]`, in m, rad, m, rad, m, and fractional momentum deviation. Positive z is toward the bunch head; positive delta is higher momentum. Electron energy is kinetic energy in MeV. Transverse normalized emittances are in mm·mrad. Generated macroparticles are equally weighted; they do not represent an absolute current calibration.

- **Drift:** transverse drift and first-order velocity slip `R56 = L/gamma^2`.
- **Quadrupole:** exact thick focusing/defocusing matrices; positive gradient focuses x. Strength uses the reference electron magnetic rigidity. Includes drift-like longitudinal velocity slip.
- **Dipole:** horizontal sector-body matrix with editable body angle and independent geometric entrance/exit edge angles. Includes dispersion, transverse/path-length coupling, geometric R56, velocity slip, and a finite-fringe correction to the vertical edge kick. No combined-function gradient. For a rectangular bend, set each edge to half the bend angle using the displayed signed convention. Edge angles remain independent when the body angle changes.
  The edge matrices use the MAD-X convention, with `h = angle/L`, geometric pole-face angle `e`, `R21 = h*tan(e)`, and `R43 = -h*tan(e - psi)`, where:

  ```text
  psi = 2 * HGAP * FINT * h * (1 + sin(e)^2) / cos(e)
  HGAP = 0.010 m  (20 mm full gap)
  FINT = 0.5
  ```

  `FINT=0.5` is a conventional fringe-integral choice. The 20 mm full gap is a fixed teaching-model assumption, not a universal magnet gap. Psi is computed separately at each face and changes with curvature and geometric edge angle; it is not an arbitrary constant angle. These parameters are not exposed as controls. At zero geometric edge angle the correction is a weak **vertical defocusing** kick, for either bend direction. At nonzero edge angles it modifies the existing edge focusing. The horizontal edge kick and sector-body matrix are unchanged. This remains a linear thin-edge representation of the integrated fringe effect, not field-map tracking through an extended fringe region.

  Existing preset/element files require no new fields: previously saved bend angles, edge angles, lengths, beam definitions and passcodes are retained. Their vertical transport now includes the corrected fringe optics; numerical results from old hard-edge calculations can therefore change. Gap is not treated as an aperture, no element lengths are added, and all screen positions remain path-length coordinates.

  Formula reference: [Fermilab TM-2753-AD, Appendix A.1](https://lss.fnal.gov/archive/test-tm/2000/fermilab-tm-2753-ad.pdf). The half-gap convention includes the factor of two explicitly.

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

Run `node diagnostics.test.js` for screen histogram and display-resolution checks.

Run `node fringe.test.js` for the fixed finite-fringe model and compatibility with existing saved presets.

Run `node physics.test.js` (Node.js 18+). The 17 checks cover reference rigidity, symplecticity, limiting maps, dipole dispersion and edges, thick-TDC coupling and affine composition, frequency/phase behavior, reproducible polynomial chirp, slit cuts, centered RMS, screen positioning, full particle loss, and invalid inputs.

Browser checks exercised instructor unlock, slit creation/editing, screen measurements before and after the slit, and student JSON export. Browser upload approval was declined, so the file-picker load round trip was not verified in that browser session.

## Files

- `index.html`: page structure
- `style.css`: responsive interface
- `app.js`: editor, plotting, instructor controls, share links, save/load
- `diagnostics.js`: non-mutating screen histogram/range preparation
- `diagnostics.test.js`: histogram resolution, boundaries, count conservation and particle preservation
- `defaults.json`: shared instructor setup loaded by the main student URL
- `settings.js`: defaults loading, revision-aware session restoration, and authenticated GitHub publishing
- `settings.test.js`: shared-defaults and publishing checks
- `presets.js`: named presets, migration, default selection and isolated student workspaces
- `presets.test.js`: preset collection and publishing checks
- `physics.js`: independent 6D transport engine
- `physics.test.js`: analytic and behavioral validation
- `fringe.test.js`: finite-fringe sign, symplecticity, transport boundaries and legacy-file compatibility
- `density.test.js`: six-coordinate profile generation, exact second moments, chirp ordering and preset round trips

Run `node density.test.js` to check profile shape changes, component separation, all six normalized-coordinate covariances, fixed emittances and Twiss parameters, and polynomial chirp ordering.

Run `node app.test.js` to check preset/profile editing and switching through a minimal DOM adapter.

Run `node presets.test.js` to check preset migration, selection, workspace isolation, published defaults and collection round trips.

Run `node settings.test.js` to check shared-defaults loading, revision changes, passcode preservation, GitHub publishing, conflicts, denied authorization, and error handling. These use mocked GitHub requests and no credentials.

No packages or installation are needed to run the simulator.
