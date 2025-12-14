# CheckTheRisk

This project aims to predict the post operation risk group of NSMP endometry patients. This prediction is done after the surgery and provides the medical staff with tools to decide the best course of treatment.

Besides our basical statistical model we also have a chatbot that, being trained with the medical studies found suitable by the medical staff it can answer its questions taking into account the prediction of our classical statistical model.

The biggest problem we faced, and that we assume Fundacio Sant Pau also faces, is the low sample number, so we decided to build a system so that this sample size could be increase organically by the users of the tool.

This system consists on a way for the doctors to add new data through a form, once the new data is added there is a button to retrain the model so that the consequent predictions also take into account the new data begin fed.

---

Aquest projecte té com a objectiu predir el grup de risc postoperatori en pacients amb càncer d'endometri NSMP. Aquesta predicció es realitza després de la cirurgia i proporciona a l'equip mèdic eines per decidir la millor pauta de tractament.

A més del nostre model estadístic bàsic, també disposem d'un xatbot que, entrenat amb els estudis mèdics validats pel personal sanitari, pot respondre preguntes tenint en compte la predicció del nostre model estadístic clàssic.

El principal problema que hem afrontat, i que assumim que la Fundació Sant Pau també afronta, és la mida reduïda de la mostra (dataset). Per això, hem decidit construir un sistema perquè aquesta mostra pugui augmentar orgànicament mitjançant l'ús de l'eina per part dels usuaris.

Aquest sistema permet als doctors afegir noves dades a través d'un formulari. Un cop afegides, es disposa d'un botó per reentrenar el model, de manera que les prediccions futures tinguin en compte la nova informació introduïda
