# Occupational Mobility Network (vendored)

`occupational_mobility_network.csv.gz` and `ipums_variables.csv` are from the replication
package for:

> del Rio-Chanona RM, Mealy P, Beguerisse-Díaz M, Lafond F, Farmer JD. 2021.
> *Occupational mobility and automation: a data-driven network model.*
> J. R. Soc. Interface 17: 20200898. https://doi.org/10.1098/rsif.2020.0898

Network construction methodology (cite when using the network):

> Mealy P, del Rio-Chanona RM, Farmer JD. 2018. *What you do at work matters: new lenses
> on labour.* SSRN 3143064. https://ssrn.com/abstract=3143064

Source: Zenodo record 4453162 (https://zenodo.org/records/4453162).
**License: Creative Commons Attribution 4.0 International (CC BY 4.0)** — commercial use and
redistribution of derived numbers permitted with attribution.

## What this is

`occupational_mobility_network.csv` — a 464×464 adjacency matrix. Row *i* → column *j* is the
empirical weight of workers transitioning from occupation *i* to occupation *j*, derived from
**observed** US CPS worker transitions (2010–2017). This is real behavioral mobility, NOT
skill/task similarity. The diagonal is self-retention (staying in the same occupation).

`ipums_variables.csv` — maps each matrix row/column `id` (0–463) to its ACS occupation
`label`, `acs_occ_code`, major-group `classification`, and characteristics (wage, employment,
automation probability).

## Resolution caveat

ACS resolution is coarser than our SOC/O*NET taxonomy. Notably **ACS has a single "designers"
bucket (id 128)** for UX, graphic, interior, product, and industrial designers — so flows into
any of those collapse to one number. `taxonomy/acs-crosswalk.json` maps our occupations to ACS
ids; where two of our occupations share an ACS id, the flow between them is not resolvable and
is emitted as null (other signals fall back in).
