# Marlboro Predictor

This project aims to predict the post operation risk group of NSMP endometry patients. This prediction is done after the surgery and provides the medical staff with tools to decide the best course of treatment.

Besides our basical statistical model we also have a chatbot that, being trained with the medical studies found suitable by the medical staff it can answer its questions taking into account the prediction of our classical statistical model.

The biggest problem we faced, and that we assume Fundacio Sant Pau also faces, is the low sample number, so we decided to build a system so that this sample size could be increase organically by the users of the tool.

This system consists on a way for the doctors to add new data through a form, once the new data is added there is a button to retrain the model so that the consequent predictions also take into account the new data begin fed.
