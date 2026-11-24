# dataland-frontend

## Compare companies in a portfolio

Open your own portfolio or one shared with you and select **Compare Portfolio**. Choose a framework and reporting
period to see its KPIs side by side, with one column per company. **No dataset** means the company has no available
dataset for the selection; a dash marks an unavailable value.

**Min** and **Max** mark the lowest and highest comparable numbers in a row when at least two values differ. They
indicate relative position, not performance or quality. Missing values are excluded, and values with different units
are not ranked together. **Only show differences in comparable values** keeps rows whose comparable values differ;
it does not compare complex values such as nested tables. On narrow screens, scroll horizontally to reach the other
companies. KPI labels and group headings stay visible.

## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run serve
```

### Compiles and minifies for production

```
npm run build
```

### Lints and fixes files

```
npm run lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).
