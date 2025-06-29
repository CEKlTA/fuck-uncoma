import * as d3 from "d3";
import { careers, electives } from "./careers/careers.ts";
import phrases from "./phrases.json";

import type { CareerDB, Elective } from "./types.ts";

window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    info_button && (info_button.disabled = false);
    links_button && (links_button.disabled = false);
    tree_button && (tree_button.disabled = false);
    career && (career.disabled = false);
  }, 5800);
});
// Mr nothing was here :P 
const subtext = document.querySelector("#subtext") as HTMLElement | null;
if (subtext && Array.isArray(phrases)) {
  subtext.textContent = phrases[Math.floor(Math.random() * phrases.length)];
}

const career = document.querySelector("#career") as HTMLSelectElement | null;
career?.addEventListener("change", () => {
  career.blur();
  update_graph();
  update_tree();
});

let selected_index: number = 0;
let db: CareerDB = [];
let groupPaths: d3.Selection<SVGPathElement, d3.ChordGroup, d3.BaseType, unknown>;
let ribbons: d3.Selection<SVGPathElement, d3.Ribbon, d3.BaseType, unknown>;

const name_element = document.querySelector("#name") as HTMLElement | null;

const width = 500, height = 500;
const outerRadius = Math.min(width, height) * 0.5;
const innerRadius = outerRadius - 15;

const svg = d3.select<SVGSVGElement, unknown>("#graph")
  .attr("viewBox", [-width / 2, -height / 2, width, height] as any);

const chord = d3.chordDirected()
  .padAngle(0.02);

const arc = d3.arc()
  .innerRadius(innerRadius * 1.02)
  .outerRadius(outerRadius);

const ribbon: d3.RibbonArrowGenerator<any, d3.Ribbon, d3.RibbonSubgroup> = d3.ribbonArrow()
  .radius(innerRadius)
  .padAngle(0.01);

function update_graph() {
  if (!career || !name_element) return;

  const selectedCareer = career.value as keyof typeof careers;
  if (!selectedCareer || !(selectedCareer in careers)) return;

  db = careers[selectedCareer];
  selected_index = 0;

  const matrix = db.map(subject =>
    Array.from({ length: db.length }, (_, index) =>
      Number(subject.correlatives.includes(index + 1))
    )
  );

  const chords = chord(matrix);

  name_element.textContent = db[selected_index].name;

  svg.selectAll("*").remove();

  svg.append("g")
    .selectAll("path")
    .data(chords.groups)
    .join("path")
    .attr("fill", d => d3.hsl(Math.round(d.index / matrix.length * 270), 1, 0.5).toString())
    .attr("fill-opacity", 0.5)
    .attr("stroke", "white")
    .attr("stroke-width", g => g.index === selected_index ? 2 : 0)
    .attr("d", (d) => arc({
      startAngle: d.startAngle,
      endAngle: d.endAngle,
      innerRadius: innerRadius,
      outerRadius: outerRadius
    }))
    .on("mouseover", (_, d) => {
      selected_index = d.index;
      render_selection(selected_index);
    });

  svg.append("g")
    .selectAll("path")
    .data(chords)
    .join("path")
    .attr("fill", d => d3.hsl(Math.round(d.target.index / matrix.length * 270), 1, 0.5).toString())
    .attr("fill-opacity", 0.5)
    //@ts-ignore
    .attr("d", (d) => ribbon(d))

  groupPaths = svg.select("g").selectAll("path");
  ribbons = svg.selectAll("g").filter((_, i) => i === 1).selectAll("path");
}

document.addEventListener("DOMContentLoaded", () => {
  update_graph();
  update_tree();
})

window.onkeydown = (event: KeyboardEvent) => {
  if (!db) return;
  switch (event.key) {
    case "ArrowLeft":
      selected_index = (selected_index + db.length - 1) % db.length;
      render_selection(selected_index);
      break;
    case "ArrowRight":
      selected_index = (selected_index + 1) % db.length;
      render_selection(selected_index);
      break;
    case " ":
    case "Escape":
    case "Enter":
    case "q":
      clear_selection();
      break;
  }
};

function render_selection(index: number) {
  if (!name_element) return;
  name_element.textContent = db[index].name;

  groupPaths
    .transition()
    .duration(100)
    .attr("fill-opacity", g =>
      g.index === index ||
        db[g.index].correlatives.includes(index + 1) ||
        db[index].correlatives.includes(g.index + 1) ? 1 : 0.1)
    .attr("stroke-width", g => g.index === index ? 2 : 0);

  ribbons
    .transition()
    .duration(100)
    .attr("fill-opacity", (r: any) => r.source.index === index || r.target.index === index ? 0.7 : 0.05);
}

function clear_selection() {
  groupPaths
    .transition()
    .duration(500)
    .attr("fill-opacity", 0.5)
    .attr("stroke-width", g => g.index === selected_index ? 2 : 0);

  ribbons
    .transition()
    .duration(500)
    .attr("fill-opacity", 0.5);
}

const info_button_query = document.querySelector("#info") as HTMLButtonElement | null;
const links_button_query = document.querySelector("#links") as HTMLButtonElement | null;
const modal = document.querySelector("#modal") as HTMLElement | null;
const modal_content = document.querySelector("#modal-content") as HTMLElement | null;
const close_modal = document.querySelector("#modal_close") as HTMLElement | null;
const tree_button = document.querySelector("#tree_button")  as HTMLButtonElement | null;
const tree = document.querySelector("#tree") as HTMLElement | null;
const container = document.querySelector(".container") as HTMLElement | null;
const tree_ul = tree?.querySelector("ul");

tree_button?.addEventListener("click", () => {
  tree?.classList.toggle("active");
  container?.classList.toggle("active");
  tree_button.classList.toggle("active");
  tree_button.blur();
});

function update_tree() {
  if (!career || !name_element) return;

  const selectedCareer = career.value;
  const elective = electives[selectedCareer + "_electives"];

  tree_ul?.replaceChildren();

  elective.forEach(elec => {
    let elective_element = document.createElement("li");
    elective_element.textContent = elec.name;
    elective_element.addEventListener("click", () => {
      render_elective(elec);
    })
    tree_ul?.appendChild(elective_element);
  })
}

function render_elective(elective: Elective) {
  groupPaths
    .transition()
    .duration(100)
    .attr("fill-opacity", g => elective.correlatives.includes(g.index + 1) ? 1 : 0.1)
    .attr("stroke-width", g => elective.correlatives.includes(g.index + 1) ? 2 : 0);

  ribbons
    .transition()
    .duration(100)
    .attr("fill-opacity", 0.05);
}

info_button?.addEventListener("click", () => {
  if (!modal || !modal_content) return;
  modal_content.innerHTML = /*html*/`
    <section style="max-width: 600px; margin: auto; padding: 1rem; font-family: sans-serif;">
      <h1>la fai me tiene pelotudo</h1>
      <br>
      <p>
        no sabia que mierda tenia que rendir para que mi vieja no me cague a bifes, por ende, gestioné una una fucking pagina web con toda la data, tengo las bolas por el piso con algebra, con msi, con rpa, con ic, con la puta de tu tia y con el arquitecto re poronga que construyó la fai en una cierra.
      </p>
      <br>
      <p>las flechitas indican la correlativa, podes moverte con las flechitas y salis con el escape, el espacio, el enter o la Q. si te trabas sos bien pelotudo flaco, deja la carrera...</p>
      <br>
      <p><b>typescript es el goty of the year, no mas palabras señor juez</b></p>
      <img class="gordi" src="/gordo_gradle.webp" alt="gordo_gradle.webp">
    </section>
  `;
  modal.style.display = "flex";
});

links_button?.addEventListener("click", () => {
  if (!modal || !modal_content) return;
  modal_content.innerHTML = /*html*/`
    <p>sabes que le pasa a los curiosos?</p>
    <ul class="list">
      <li><a href="https://uncoma.edu.ar/carreras/licenciatura-en-ciencias-de-la-computacion/">- página oficial de la uncoma</a></li>
      <li><a href="https://uncoma.edu.ar/wp-content/uploads/2022/09/ord_1112_20131.pdf">- pdf del plan de estudio cogido</a></li>
    </ul>
  `;
  modal.style.display = "flex";
});

close_modal?.addEventListener("click", () => {
  if (modal) modal.style.display = "none";
});

window.onclick = e => {
  if (e.target === modal) modal!.style.display = "none";
};
